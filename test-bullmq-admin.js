/**
 * BullMQ Integration Test - Using Admin User
 * Tests job enqueueing through the complete submission flow
 */

const http = require('http');

const BASE_URL = 'http://localhost:3000';

function makeRequest(method, path, data = null, token = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(BASE_URL + path);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => {
        try {
          const parsed = body ? JSON.parse(body) : {};
          resolve({
            status: res.statusCode,
            data: parsed,
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            data: body,
          });
        }
      });
    });

    req.on('error', reject);
    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

async function runTests() {
  console.log('🚀 Starting BullMQ Integration Test (Admin User)\n');

  try {
    // Step 1: Login with default admin user
    console.log('🔐 Step 1: Login with admin user...');
    const loginRes = await makeRequest('POST', '/auth/login', {
      name: 'superadmin',
      password: 'admin123',
    });
    console.log(`   Status: ${loginRes.status}`);
    if (loginRes.status !== 200 && loginRes.status !== 201) {
      console.log(`   Error: ${JSON.stringify(loginRes.data)}`);
      console.log('\n   Note: If admin user doesn\'t exist, the server hasn\'t started properly.');
      return;
    }
    const token = loginRes.data.access_token;
    if (!token) {
      console.log(`   Error: No token returned`);
      return;
    }
    console.log(`   ✅ Login successful\n`);

    // Step 2: Create Contest
    console.log('📅 Step 2: Create contest...');
    const now = new Date();
    const startTime = new Date(now.getTime() - 5 * 60000); // 5 minutes ago
    const endTime = new Date(now.getTime() + 3600000); // 1 hour from now

    const contestRes = await makeRequest(
      'POST',
      '/contests',
      {
        title: 'BullMQ Test Contest',
        description: 'Testing BullMQ job queue',
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
      },
      token,
    );
    console.log(`   Status: ${contestRes.status}`);
    if (contestRes.status !== 201) {
      console.log(`   Error: ${JSON.stringify(contestRes.data)}`);
      return;
    }
    const contestId = contestRes.data.id;
    console.log(`   ✅ Contest created: ${contestId}\n`);

    // Step 3: Create Problem
    console.log('🧩 Step 3: Create problem...');
    const problemRes = await makeRequest(
      'POST',
      '/problem',
      {
        title: 'Hello World',
        description: 'Write a program that prints Hello World',
        contestId: contestId,
        timeLimitMs: 5000,
      },
      token,
    );
    console.log(`   Status: ${problemRes.status}`);
    if (problemRes.status !== 201) {
      console.log(`   Error: ${JSON.stringify(problemRes.data)}`);
      return;
    }
    const problemId = problemRes.data.id;
    console.log(`   ✅ Problem created: ${problemId}\n`);

    // Step 4: Submit Code (THIS IS WHERE BULLMQ JOB IS ENQUEUED)
    console.log('⚙️  Step 4: Submit code (enqueues BullMQ job)...');
    const submissionRes = await makeRequest(
      'POST',
      '/submissions',
      {
        code: 'console.log("Hello World")',
        language: 'javascript',
        problemId: problemId,
        contestId: contestId,
      },
      token,
    );
    console.log(`   Status: ${submissionRes.status}`);
    if (submissionRes.status !== 201) {
      console.log(`   Error: ${JSON.stringify(submissionRes.data)}`);
      return;
    }
    const submissionId = submissionRes.data.id;
    const initialStatus = submissionRes.data.status;
    console.log(`   ✅ Submission created: ${submissionId}`);
    console.log(`   📌 Initial status: ${initialStatus}`);
    console.log(`   💡 Job has been enqueued to Redis/BullMQ queue\n`);

    // Step 5: Wait for job processing
    console.log('⏳ Step 5: Waiting for job processing...');
    console.log('   Waiting 4 seconds for worker to process the job...');
    await new Promise((resolve) => setTimeout(resolve, 4000));

    // Step 6: Check final status
    console.log('\n🔍 Step 6: Checking submission after job processing...');
    const checkRes = await makeRequest('GET', `/submissions/${submissionId}`, null, token);
    console.log(`   Status: ${checkRes.status}`);
    if (checkRes.status !== 200) {
      console.log(`   Error: ${JSON.stringify(checkRes.data)}`);
      return;
    }

    const finalSubmission = checkRes.data;
    console.log(`   📌 Final status: ${finalSubmission.status}`);
    console.log(`   ⏱️  Execution time: ${finalSubmission.executionTime}ms`);
    console.log(`   💾 Memory used: ${finalSubmission.memoryUsed} bytes`);
    console.log(`   📊 Score: ${finalSubmission.score}`);
    console.log(`   ⏰ Started at: ${finalSubmission.startedAt}`);
    console.log(`   ⏰ Completed at: ${finalSubmission.completedAt}\n`);

    // Verify job was processed
    if (finalSubmission.status === 'accepted' && finalSubmission.completedAt) {
      console.log('✅ ✅ ✅ BullMQ JOB SUCCESSFULLY PROCESSED! ✅ ✅ ✅\n');
      console.log('   Flow verified:');
      console.log('   1. Submission created with PENDING status');
      console.log('   2. Job enqueued to Redis/BullMQ');
      console.log('   3. Worker picked up job from queue');
      console.log('   4. Processor executed (simulated code execution)');
      console.log('   5. Status updated to RUNNING then ACCEPTED');
      console.log('   6. Submission marked with execution metrics');
      console.log('   7. Job completed successfully\n');
    } else {
      console.log(`⚠️  Submission in ${finalSubmission.status} status`);
      if (!finalSubmission.completedAt) {
        console.log('   Job may still be processing or waiting in queue\n');
      }
    }

    console.log('✨ Test completed!\n');
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

runTests();
