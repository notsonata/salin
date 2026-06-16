from __future__ import annotations

import os
import stat
import subprocess
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[3]
RUN_SCRIPT = REPO_ROOT / "run.sh"


def write_executable(path: Path, content: str) -> None:
    path.write_text(content, encoding="utf-8")
    path.chmod(path.stat().st_mode | stat.S_IXUSR | stat.S_IXGRP | stat.S_IXOTH)


def make_fake_repo(tmp_path: Path) -> Path:
    repo_root = tmp_path / "repo"
    repo_root.mkdir()
    (repo_root / "infra").mkdir()
    (repo_root / "infra" / "docker-compose.yml").write_text("services:\n", encoding="utf-8")
    (repo_root / "run.sh").write_text(RUN_SCRIPT.read_text(encoding="utf-8"), encoding="utf-8")
    (repo_root / "run.sh").chmod(RUN_SCRIPT.stat().st_mode)
    return repo_root


def test_run_sh_uses_host_worker_on_macos(tmp_path: Path) -> None:
    repo_root = make_fake_repo(tmp_path)
    run_script = repo_root / "run.sh"
    bin_dir = tmp_path / "bin"
    bin_dir.mkdir()
    log_path = tmp_path / "commands.log"
    write_executable(
        bin_dir / "uname",
        "#!/usr/bin/env sh\n"
        "printf 'Darwin\\n'\n",
    )
    write_executable(
        bin_dir / "docker",
        "#!/usr/bin/env sh\n"
        "printf 'docker:%s\\n' \"$*\" >> \"$TEST_LOG\"\n",
    )
    write_executable(
        bin_dir / "uv",
        "#!/usr/bin/env sh\n"
        "printf 'uv:DATABASE_URL=%s REDIS_URL=%s ARGS=%s\\n' "
        "\"$DATABASE_URL\" \"$REDIS_URL\" \"$*\" >> \"$TEST_LOG\"\n",
    )
    write_executable(
        bin_dir / "python3",
        "#!/usr/bin/env sh\n"
        "exit 0\n",
    )
    write_executable(
        bin_dir / "ffmpeg",
        "#!/usr/bin/env sh\n"
        "exit 0\n",
    )

    env = os.environ | {
        "PATH": f"{bin_dir}:{os.environ['PATH']}",
        "TEST_LOG": str(log_path),
        "DATABASE_URL": "postgresql+psycopg://salin:salin@postgres:5432/salin",
        "REDIS_URL": "redis://redis:6379/0",
    }

    result = subprocess.run(
        [str(run_script)],
        cwd=repo_root,
        env=env,
        text=True,
        capture_output=True,
        check=False,
    )

    assert result.returncode == 0, result.stderr
    log_lines = log_path.read_text(encoding="utf-8").splitlines()
    assert any(
        line == (
            f"docker:compose -f {repo_root / 'infra/docker-compose.yml'} "
            "up --build --detach postgres redis api web"
        )
        for line in log_lines
    )
    assert any(
        line == (
            "uv:DATABASE_URL=postgresql+psycopg://salin:salin@localhost:5432/salin "
            "REDIS_URL=redis://localhost:6379/0 "
            "ARGS=run --package salin-worker rq worker -w rq.worker.SpawnWorker "
            "salin-recordings --url "
            "redis://localhost:6379/0"
        )
        for line in log_lines
    )
    assert any(
        line == f"docker:compose -f {repo_root / 'infra/docker-compose.yml'} down"
        for line in log_lines
    )


def test_run_sh_keeps_full_docker_stack_off_macos(tmp_path: Path) -> None:
    repo_root = make_fake_repo(tmp_path)
    run_script = repo_root / "run.sh"
    bin_dir = tmp_path / "bin"
    bin_dir.mkdir()
    log_path = tmp_path / "commands.log"
    write_executable(
        bin_dir / "uname",
        "#!/usr/bin/env sh\n"
        "printf 'Linux\\n'\n",
    )
    write_executable(
        bin_dir / "docker",
        "#!/usr/bin/env sh\n"
        "printf 'docker:%s\\n' \"$*\" >> \"$TEST_LOG\"\n",
    )
    write_executable(
        bin_dir / "uv",
        "#!/usr/bin/env sh\n"
        "printf 'uv:%s\\n' \"$*\" >> \"$TEST_LOG\"\n",
    )
    write_executable(
        bin_dir / "python3",
        "#!/usr/bin/env sh\n"
        "exit 0\n",
    )

    env = os.environ | {
        "PATH": f"{bin_dir}:{os.environ['PATH']}",
        "TEST_LOG": str(log_path),
    }

    result = subprocess.run(
        [str(run_script)],
        cwd=repo_root,
        env=env,
        text=True,
        capture_output=True,
        check=False,
    )

    assert result.returncode == 0, result.stderr
    log_lines = log_path.read_text(encoding="utf-8").splitlines()
    assert log_lines == [
        f"docker:compose -f {repo_root / 'infra/docker-compose.yml'} up --build",
    ]


def test_run_sh_falls_back_to_repo_tooling_rq_when_uv_is_unavailable(
    tmp_path: Path,
) -> None:
    repo_root = make_fake_repo(tmp_path)
    run_script = repo_root / "run.sh"
    bin_dir = tmp_path / "bin"
    bin_dir.mkdir()
    log_path = tmp_path / "commands.log"
    write_executable(
        bin_dir / "uname",
        "#!/usr/bin/env sh\n"
        "printf 'Darwin\\n'\n",
    )
    write_executable(
        bin_dir / "docker",
        "#!/usr/bin/env sh\n"
        "printf 'docker:%s\\n' \"$*\" >> \"$TEST_LOG\"\n",
    )
    write_executable(
        bin_dir / "python3",
        "#!/usr/bin/env sh\n"
        "if [ \"$1\" = \"-m\" ] && [ \"$2\" = \"uv\" ] && [ \"$3\" = \"--version\" ]; then\n"
        "  exit 1\n"
        "fi\n"
        "exit 0\n",
    )
    write_executable(
        bin_dir / "ffmpeg",
        "#!/usr/bin/env sh\n"
        "exit 0\n",
    )
    tooling_rq = repo_root / ".venv-tooling" / "bin" / "rq"
    tooling_rq.parent.mkdir(parents=True)
    write_executable(
        tooling_rq,
        "#!/usr/bin/env sh\n"
        "printf 'tooling-rq:PYTHONPATH=%s DATABASE_URL=%s REDIS_URL=%s ARGS=%s\\n' "
        "\"$PYTHONPATH\" \"$DATABASE_URL\" \"$REDIS_URL\" \"$*\" >> \"$TEST_LOG\"\n",
    )

    env = {
        "PATH": f"{bin_dir}:{os.environ['PATH']}",
        "TEST_LOG": str(log_path),
        "DATABASE_URL": "postgresql+psycopg://salin:salin@postgres:5432/salin",
        "REDIS_URL": "redis://redis:6379/0",
    }

    result = subprocess.run(
        [str(run_script)],
        cwd=repo_root,
        env=env,
        text=True,
        capture_output=True,
        check=False,
    )

    assert result.returncode == 0, result.stderr
    log_lines = log_path.read_text(encoding="utf-8").splitlines()
    assert any(
        line == (
            f"tooling-rq:PYTHONPATH={repo_root / 'apps/api'}:{repo_root / 'apps/worker'} "
            "DATABASE_URL=postgresql+psycopg://salin:salin@localhost:5432/salin "
            "REDIS_URL=redis://localhost:6379/0 "
            "ARGS=worker -w rq.worker.SpawnWorker salin-recordings --url "
            "redis://localhost:6379/0"
        )
        for line in log_lines
    )


def test_run_sh_bootstraps_tooling_worker_dependencies_for_pyannote(
    tmp_path: Path,
) -> None:
    repo_root = make_fake_repo(tmp_path)
    run_script = repo_root / "run.sh"
    bin_dir = tmp_path / "bin"
    bin_dir.mkdir()
    log_path = tmp_path / "commands.log"
    write_executable(
        bin_dir / "uname",
        "#!/usr/bin/env sh\n"
        "printf 'Darwin\\n'\n",
    )
    write_executable(
        bin_dir / "docker",
        "#!/usr/bin/env sh\n"
        "printf 'docker:%s\\n' \"$*\" >> \"$TEST_LOG\"\n",
    )
    write_executable(
        bin_dir / "python3",
        "#!/usr/bin/env sh\n"
        "if [ \"$1\" = \"-m\" ] && [ \"$2\" = \"uv\" ] && [ \"$3\" = \"--version\" ]; then\n"
        "  exit 1\n"
        "fi\n"
        "exit 0\n",
    )
    write_executable(
        bin_dir / "ffmpeg",
        "#!/usr/bin/env sh\n"
        "exit 0\n",
    )
    tooling_dir = repo_root / ".venv-tooling" / "bin"
    tooling_dir.mkdir(parents=True)
    write_executable(
        tooling_dir / "python",
        "#!/usr/bin/env sh\n"
        "printf 'tooling-python:%s\\n' \"$*\" >> \"$TEST_LOG\"\n"
        "if [ \"$1\" = \"-c\" ]; then\n"
        "  exit 1\n"
        "fi\n"
        "exit 0\n",
    )
    write_executable(
        tooling_dir / "rq",
        "#!/usr/bin/env sh\n"
        "printf 'tooling-rq:%s\\n' \"$*\" >> \"$TEST_LOG\"\n",
    )

    env = {
        "PATH": f"{bin_dir}:{os.environ['PATH']}",
        "TEST_LOG": str(log_path),
        "DATABASE_URL": "postgresql+psycopg://salin:salin@postgres:5432/salin",
        "REDIS_URL": "redis://redis:6379/0",
        "DIARIZATION_PROVIDER": "pyannote",
    }

    result = subprocess.run(
        [str(run_script)],
        cwd=repo_root,
        env=env,
        text=True,
        capture_output=True,
        check=False,
    )

    assert result.returncode == 0, result.stderr
    log_lines = log_path.read_text(encoding="utf-8").splitlines()
    assert any(
        line == (
            f"tooling-python:-m pip install -e {repo_root / 'apps/api'} "
            f"-e {repo_root / 'apps/worker'}"
        )
        for line in log_lines
    )
    assert any(
        line == "tooling-rq:worker -w rq.worker.SpawnWorker salin-recordings --url redis://localhost:6379/0"
        for line in log_lines
    )
