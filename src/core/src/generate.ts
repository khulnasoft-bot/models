import fs from 'fs';
import path from 'path';
import { parse } from 'smol-toml';
import { globSync } from 'glob';

export function generateModelsData() {
  const providers = globSync('src/providers/*/provider.toml');
  const allModels = [];

  for (const providerPath of providers) {
    const providerDir = path.dirname(providerPath);
    const providerContent = fs.readFileSync(providerPath, 'utf-8');
    const providerData: any = parse(providerContent);
    
    const models = globSync(`${providerDir}/models/*.toml`);

    for (const modelPath of models) {
      const modelContent = fs.readFileSync(modelPath, 'utf-8');
      const modelData: any = parse(modelContent);
      
      allModels.push({
        ...modelData,
        provider: providerData.name.toLowerCase(),
        providerLogo: `/src/providers/${path.basename(providerDir)}/logo.svg`,
        id: `${providerData.name.toLowerCase()}-${path.basename(modelPath, '.toml')}`,
      });
    }
  }

  return allModels;
}
