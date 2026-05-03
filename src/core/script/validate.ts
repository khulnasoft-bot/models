import fs from 'fs';
import path from 'path';
import * as semver from 'semver';
import { parse } from 'smol-toml';
import { globSync } from 'glob';
import { ProviderSchema, ModelSchema } from '../src/schema';

function validate() {
  console.log('🚀 Validating providers and models...');

  const providers = globSync('src/providers/*/provider.toml');
  let errors = 0;

  for (const providerPath of providers) {
    try {
      const content = fs.readFileSync(providerPath, 'utf-8');
      const data = parse(content);
      ProviderSchema.parse(data);
      console.log(`✅ Provider: ${providerPath}`);

      const providerDir = path.dirname(providerPath);
      const models = globSync(`${providerDir}/models/*.toml`);

      for (const modelPath of models) {
        try {
          const modelContent = fs.readFileSync(modelPath, 'utf-8');
          const modelData = parse(modelContent);
          ModelSchema.parse(modelData);
          console.log(`  ✅ Model: ${modelPath}`);
        } catch (err: any) {
          console.error(`  ❌ Error in ${modelPath}:`, err.message);
          errors++;
        }
      }
    } catch (err: any) {
      console.error(`❌ Error in ${providerPath}:`, err.message);
      errors++;
    }
  }

  if (errors > 0) {
    console.error(`\nFound ${errors} errors.`);
    process.exit(1);
  } else {
    console.log('\n✨ All files are valid!');
  }
}

validate();
