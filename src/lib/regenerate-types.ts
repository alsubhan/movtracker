import { regenerateTypes } from './supabase';

async function main() {
  try {
    const typeDefinition = await regenerateTypes();
    console.log('Generated type definition:\n', typeDefinition);
  } catch (error) {
    console.error('Error:', error);
  }
}

main();
