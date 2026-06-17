import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

// Map of Lucide to Phosphor
const iconMap = {
  Loader2: 'CircleNotch',
  Play: 'Play',
  Pause: 'Pause',
  Download: 'DownloadSimple',
  FileDown: 'FileArrowDown',
  FileText: 'FileText',
  CircleAlert: 'WarningCircle',
  NotebookPen: 'Notepad',
  RefreshCw: 'ArrowsClockwise',
  Save: 'FloppyDisk',
  ArrowLeft: 'ArrowLeft',
  Check: 'Check',
  Pencil: 'Pencil',
  X: 'X',
  AudioLines: 'Waveform',
  LibraryBig: 'Books',
  Menu: 'List',
  PanelRightOpen: 'Sidebar',
  ExternalLink: 'ArrowSquareOut',
  Headphones: 'Headphones'
};

function getFiles(dir) {
  const subdirs = readdirSync(dir);
  const files = subdirs.map(subdir => {
    const res = join(dir, subdir);
    return statSync(res).isDirectory() ? getFiles(res) : res;
  });
  return files.reduce((a, f) => a.concat(f), []).filter(f => f.endsWith('.tsx'));
}

const files = [...getFiles('apps/web/app'), ...getFiles('apps/web/components')];

for (const file of files) {
  let content = readFileSync(file, 'utf8');
  if (content.includes('lucide-react')) {
    // Replace the import statement
    content = content.replace(/import\s+{([^}]+)}\s+from\s+["']lucide-react["'];/g, (match, importsStr) => {
      const imports = importsStr.split(',').map(i => i.trim()).filter(Boolean);
      const newImports = imports.map(i => iconMap[i] || i);
      return `import { ${newImports.join(', ')} } from "@phosphor-icons/react";`;
    });

    // Replace the component usages
    for (const [lucide, phosphor] of Object.entries(iconMap)) {
      if (lucide !== phosphor) {
        content = content.replace(new RegExp(`<${lucide}\\b`, 'g'), `<${phosphor}`);
        content = content.replace(new RegExp(`</${lucide}>`, 'g'), `</${phosphor}>`);
      }
    }
    
    // Inject weight="bold" if missing
    const phosphorIcons = Object.values(iconMap);
    for (const icon of phosphorIcons) {
      // only replace if there isn't already a weight=
      content = content.replace(new RegExp(`<${icon}(\\s+)(?!.*weight=)`, 'g'), `<${icon} weight="bold"$1`);
    }

    writeFileSync(file, content, 'utf8');
    console.log(`Updated ${file}`);
  }
}
