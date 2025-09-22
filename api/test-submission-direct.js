// Direct test without HTTP API - testing database functionality
const { sequelize } = require('./src/config/sequelize');
const {
  Problem,
  SubmissionCode,
  Submission
} = require('./src/models');

async function testSubmissionStorage() {
  console.log('🧪 Testing Submission Storage (Direct Database)...\n');

  try {
    // Ensure database connection
    await sequelize.authenticate();
    console.log('✅ Database connection established');

    // Test 1: Create a submission code
    console.log('\n1. Testing submission code creation...');
    const submissionCode = await SubmissionCode.create({
      source_code: `# Test submission
def solution():
    return "Hello World!"

print(solution())`
    });
    console.log('✅ Submission code created with ID:', submissionCode.id);

    // Test 2: Create a submission record
    console.log('\n2. Testing submission creation...');
    const submission = await Submission.create({
      user_id: 1,
      problem_id: 1,
      code_id: submissionCode.id,
      language: 'python',
      status: 'error',
      score: 0,
      exec_time: 150,
      memory_used: 1024,
      submitted_at: new Date()
    });
    console.log('✅ Submission created with ID:', submission.id);

    // Test 3: Fetch submissions with associations
    console.log('\n3. Testing submission retrieval with associations...');
    const submissions = await Submission.findAll({
      where: { user_id: 1 },
      include: [{
        model: SubmissionCode,
        as: 'Code',
        attributes: ['source_code']
      }],
      limit: 5,
      order: [['submitted_at', 'DESC']]
    });

    console.log('✅ Retrieved submissions:', submissions.length);
    if (submissions.length > 0) {
      console.log('📋 Latest submission:', {
        id: submissions[0].id,
        language: submissions[0].language,
        status: submissions[0].status,
        score: submissions[0].score,
        hasSourceCode: !!submissions[0].Code?.source_code
      });
    }

    // Test 4: Test with Problem association
    console.log('\n4. Testing submission with Problem association...');
    const submissionsWithProblem = await Submission.findAll({
      where: { user_id: 1 },
      include: [
        {
          model: SubmissionCode,
          as: 'Code',
          attributes: ['source_code']
        },
        {
          model: Problem,
          attributes: ['id', 'title', 'difficulty'],
          required: false
        }
      ],
      limit: 5,
      order: [['submitted_at', 'DESC']]
    });

    console.log('✅ Retrieved submissions with problem data:', submissionsWithProblem.length);

    // Test 5: Aggregate statistics
    console.log('\n5. Testing submission statistics...');
    const totalSubmissions = await Submission.count({
      where: { user_id: 1 }
    });

    const statusStats = await Submission.findAll({
      where: { user_id: 1 },
      attributes: [
        'status',
        [sequelize.fn('COUNT', sequelize.col('status')), 'count']
      ],
      group: ['status'],
      raw: true
    });

    console.log('✅ Statistics retrieved successfully');
    console.log('📊 Total submissions:', totalSubmissions);
    console.log('📊 Status breakdown:', statusStats);

    console.log('\n🎉 All database tests passed! Submission storage is working correctly at the database level.');

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error('Stack trace:', error.stack);
  } finally {
    await sequelize.close();
  }
}

// Run the test
testSubmissionStorage();
