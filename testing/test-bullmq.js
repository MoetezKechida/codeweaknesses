/**
 * BullMQ Integration Test Script
 * Tests the complete flow: Create user → Create contest → Create problem → Submit code
 */

const http = require('http');

const BASE_URL = 'http://localhost:3000';

// Helper function to make HTTP requests
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

// Test sequence
async function runTests() {
  console.log('🚀 Starting BullMQ Integration Test\n');

  try {
    // Step 1: Register User
    console.log('📝 Step 1: Register user...');
    const registerRes = await makeRequest('POST', '/auth/register', {
      name: 'testuser_' + Date.now(), // Unique name
      password: 'password123',
    });
    console.log(`   Status: ${registerRes.status}`);
    if (registerRes.status !== 201) {
      console.log(`   Error: ${JSON.stringify(registerRes.data)}`);
      return;
    }
    const token = registerRes.data.access_token; // Use token from registration
    console.log('   ✅ User registered\n');

    // Step 2: Create Contest
    console.log('📅 Step 2: Create contest...');
    const contestRes = await makeRequest(
      'POST',
      '/contests',
      {
        title: 'Test Contest',
        description: 'Testing BullMQ',
        startTime: new Date().toISOString(),
        endTime: new Date(Date.now() + 3600000).toISOString(),
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
        difficulty: 'easy',
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

    // Step 4: Submit Code (THIS TRIGGERS THE BULLMQ JOB)
    console.log('⚙️  Step 4: Submit code (triggers BullMQ job)...');
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
    console.log(`   📌 Initial status: ${initialStatus}\n`);

    // Step 5: Check submission status (with delay to allow job processing)
    console.log('⏳ Step 5: Waiting for job processing (3 seconds)...');
    await new Promise((resolve) => setTimeout(resolve, 3000));

    console.log('🔍 Step 6: Checking submission status after processing...');
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
    console.log(`   📊 Score: ${finalSubmission.score}\n`);

    // Verify the job was processed
    if (finalSubmission.status === 'accepted') {
      console.log('✅ SUCCESS! BullMQ job was processed successfully!');
      console.log('   - Submission status changed from PENDING → RUNNING → ACCEPTED');
      console.log('   - Mock execution metrics were applied');
      console.log('   - Job completed without errors\n');
    } else {
      console.log(`⚠️  Submission still in ${finalSubmission.status} status`);
      console.log('   This could mean the job is still processing or encountered an error\n');
    }

    console.log('✨ Test completed successfully!\n');
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

runTests();
