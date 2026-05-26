/**
 * Simple BullMQ Infrastructure Test
 * Verifies Redis connection and job queue exists
 */

const { Queue } = require('bullmq');

async function testInfrastructure() {
  console.log('🚀 Testing BullMQ Infrastructure\n');

  try {
    // Test Redis connection through BullMQ
    console.log('📡 Testing Redis connection...');
    const queue = new Queue('test-queue', {
      connection: {
        host: 'localhost',
        port: 6379,
      },
    });

    console.log('✅ Successfully connected to Redis\n');

    // Test adding a job to queue
    console.log('📝 Testing job enqueueing...');
    const job = await queue.add('test-job', { message: 'Hello from BullMQ!' }, {
      jobId: 'test-job-1',
    });
    console.log(`✅ Job enqueued successfully: ${job.id}\n`);

    // List jobs in queue
    console.log('📋 Checking job queue...');
    const activeJobs = await queue.getJobs(['active']);
    const pendingJobs = await queue.getJobs(['waiting']);
    console.log(`✅ Active jobs: ${activeJobs.length}`);
    console.log(`✅ Pending jobs: ${pendingJobs.length}\n`);

    // Cleanup
    await queue.clean(0);
    await queue.close();
    console.log('✨ Infrastructure test passed! BullMQ is ready.');
  } catch (error) {
    console.error('❌ Infrastructure test failed:', error.message);
    process.exit(1);
  }
}

testInfrastructure();
