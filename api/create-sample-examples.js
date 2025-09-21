const { ProblemExample } = require('./src/models');

async function createSampleExamples() {
  try {
    console.log('🚀 Creating sample examples for testing...');

    // Sample examples for problem ID 1 (adjust as needed)
    const sampleExamples = [
      {
        problem_id: 1,
        input: '2 3',
        output: '5',
        explanation: 'Simple addition: 2 + 3 = 5'
      },
      {
        problem_id: 1,
        input: '10 20',
        output: '30',
        explanation: 'Addition with larger numbers: 10 + 20 = 30'
      },
      {
        problem_id: 1,
        input: '0 0',
        output: '0',
        explanation: 'Edge case with zeros: 0 + 0 = 0'
      }
    ];

    // Create examples
    for (const exampleData of sampleExamples) {
      const example = await ProblemExample.create(exampleData);
      console.log(`✅ Created example ${example.id}: "${example.input}" -> "${example.output}"`);
    }

    console.log('\n🎉 Sample examples created successfully!');
    console.log('You can now test the API with problem ID 1');
    
  } catch (error) {
    console.error('❌ Error creating sample examples:', error);
  } finally {
    // Close database connection if needed
    process.exit(0);
  }
}

// Execute if run directly
if (require.main === module) {
  createSampleExamples();
}

module.exports = { createSampleExamples };
