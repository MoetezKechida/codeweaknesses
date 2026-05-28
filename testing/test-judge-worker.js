

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

async function runJudgeWorkerTest() {
  console.log('Starting Judge Worker Test (Docker-based Execution)\n');

  try {
    // Step 1: Login as admin
    console.log('Step 1: Login as admin...');
    const loginRes = await makeRequest('POST', '/auth/login', {
      name: 'superadmin',
      password: 'admin123',
    });
    if (loginRes.status !== 200 && loginRes.status !== 201) {
      console.log(`   Error: ${JSON.stringify(loginRes.data)}`);
      return;
    }
    const token = loginRes.data.access_token;
    console.log(` Login successful\n`);

    // Step 2: Create Contest
    console.log('Step 2: Create contest...');
    const now = new Date();
    const startTime = new Date(now.getTime() - 5 * 60000);
    const endTime = new Date(now.getTime() + 3600000);

    const contestRes = await makeRequest(
      'POST',
      '/contests',
      {
        title: 'Judge Worker Test Contest',
        description: 'Testing real code execution',
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
      },
      token,
    );
    if (contestRes.status !== 201) {
      console.log(`   Error: ${JSON.stringify(contestRes.data)}`);
      return;
    }
    const contestId = contestRes.data.id;
    console.log(`    Contest created: ${contestId}\n`);

    // Step 3: Create Problem
    console.log(' Step 3: Create problem...');
    const problemRes = await makeRequest(
      'POST',
      '/problem',
      {
        title: 'Print Numbers 1 to 3',
        description: 'Write a program that prints numbers 1 to 3, each on a new line',
        contestId: contestId,
        timeLimitMs: 5000,
      },
      token,
    );
    if (problemRes.status !== 201) {
      console.log(`   Error: ${JSON.stringify(problemRes.data)}`);
      return;
    }
    const problemId = problemRes.data.id;
    console.log(`    Problem created: ${problemId}\n`);

    // Step 4: Add test cases
    console.log(' Step 4: Adding test cases...');
    const testCases = [
      {
        input: 'test input 1',
        expectedOutput: '1\n2\n3',
        isHidden: false,
        orderIndex: 0,
      },
      {
        input: 'test input 2',
        expectedOutput: '1\n2\n3',
        isHidden: true, // Hidden test case
        orderIndex: 1,
      },
    ];

    for (const tc of testCases) {
      const tcRes = await makeRequest(
        'POST',
        `/problem/${problemId}/testcases`,
        tc,
        token,
      );
      if (tcRes.status !== 201) {
        console.log(`   Error adding test case: ${JSON.stringify(tcRes.data)}`);
        return;
      }
    }
    console.log(`    ${testCases.length} test cases added\n`);

    // Step 5: Submit correct code (JavaScript)
    console.log('  Step 5: Submitting correct JavaScript code...');
    const correctCode = `
console.log(1);
console.log(2);
console.log(3);
`.trim();

    const submissionRes = await makeRequest(
      'POST',
      '/submissions',
      {
        code: correctCode,
        language: 'javascript',
        problemId: problemId,
        contestId: contestId,
      },
      token,
    );
    if (submissionRes.status !== 201) {
      console.log(`   Error: ${JSON.stringify(submissionRes.data)}`);
      return;
    }
    const submissionId = submissionRes.data.id;
    console.log(`    Submission created: ${submissionId}`);
    console.log(`    Initial status: ${submissionRes.data.status}\n`);

    // Step 6: Wait for job processing
    console.log(' Step 6: Waiting 8 seconds for Docker execution...');
    await new Promise((resolve) => setTimeout(resolve, 8000));

    // Step 7: Check results
    console.log('Step 7: Checking submission results...');
    const checkRes = await makeRequest('GET', `/submissions/${submissionId}`, null, token);
    if (checkRes.status !== 200) {
      console.log(`   Error: ${JSON.stringify(checkRes.data)}`);
      return;
    }

    const submission = checkRes.data;
    console.log(`    Final status: ${submission.status}`);
    console.log(`    Score: ${submission.score}%`);
    console.log(`     Total execution time: ${submission.executionTime}ms`);
    console.log(`    Memory used: ${submission.memoryUsed} bytes\n`);

    // Verify results
    if (submission.status === 'accepted' && submission.score === 100) {
      console.log(' JUDGE WORKER SUCCESSFUL! \n');
      console.log('    Real Docker-based code execution verified:');
      console.log('   1. Code was executed in Docker container');
      console.log('   2. Output matched expected output');
      console.log('   3. All test cases passed');
      console.log('   4. Submission marked as ACCEPTED with 100% score\n');
    } else if (submission.status === 'wrong') {
      console.log('  Submission marked as WRONG');
      console.log(`   Some test cases failed. Score: ${submission.score}%\n`);
    } else {
      console.log(`  Submission in ${submission.status} status\n`);
    }

    console.log(' Test completed!\n');
  } catch (error) {
    console.error(' Test failed:', error.message);
  }
}

runJudgeWorkerTest();
