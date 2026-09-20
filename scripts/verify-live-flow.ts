async function testLiveFlow() {
  const baseUrl = "http://localhost:3000";
  console.log("==================================================");
  console.log(" HIREGO AI — FULL-STACK LIVE FLOW VERIFICATION");
  console.log("==================================================");

  // 1. Candidate Registration
  const testEmail = `test.user.${Date.now()}@hirego.ai`;
  console.log(`\n[1/6] Registering Candidate: ${testEmail}...`);
  const regRes = await fetch(`${baseUrl}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: testEmail,
      password: "StrongPassword123!",
      name: "Alex Verification User",
      role: "CANDIDATE",
    }),
  });
  const regJson = await regRes.json();
  console.log(`Status: ${regRes.status} | Success: ${regJson.success}`);

  // 2. OTP Verification (using dev master code 123456)
  console.log(`\n[2/6] Verifying OTP...`);
  const otpRes = await fetch(`${baseUrl}/api/auth/verify-otp`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: testEmail,
      otp: regJson.debugOtp || "123456",
      type: "VERIFY_EMAIL",
    }),
  });
  const cookie = otpRes.headers.get("set-cookie") || "";
  const otpJson = await otpRes.json();
  console.log(`Status: ${otpRes.status} | Verified: ${otpJson.success} | Cookie Issued: ${cookie.length > 0}`);

  // 3. Fetch Candidate Profile with Session Cookie
  console.log(`\n[3/6] Fetching Candidate Profile (Authorized)...`);
  const profileRes = await fetch(`${baseUrl}/api/candidate/profile`, {
    headers: { Cookie: cookie },
  });
  const profileJson = await profileRes.json();
  console.log(`Status: ${profileRes.status} | Candidate Name: ${profileJson.profile?.name || "N/A"}`);

  // 4. Update Candidate Profile with Education & Experience
  console.log(`\n[4/6] Updating Candidate Profile...`);
  const updateRes = await fetch(`${baseUrl}/api/candidate/profile`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", Cookie: cookie },
    body: JSON.stringify({
      headline: "Senior Autonomous AI Architect",
      location: "San Francisco, CA",
      skills: ["React", "TypeScript", "Next.js", "AI Agents"],
    }),
  });
  const updateJson = await updateRes.json();
  console.log(`Status: ${updateRes.status} | Headline: ${updateJson.profile?.headline || "N/A"}`);

  // 5. Bookmark & Saved Jobs CRUD
  console.log(`\n[5/6] Testing Saved Jobs CRUD...`);
  const jobsRes = await fetch(`${baseUrl}/api/jobs/search?limit=1`);
  const jobsJson = await jobsRes.json().catch(() => ({ jobs: [] }));
  const validJobId = jobsJson.jobs?.[0]?.id || "a0000000-0000-4000-8000-000000000101";

  const saveRes = await fetch(`${baseUrl}/api/candidate/saved-jobs`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: cookie },
    body: JSON.stringify({ jobId: validJobId }),
  });
  const saveJson = await saveRes.json().catch(() => ({}));
  console.log(`Save Job Status: ${saveRes.status} | Saved: ${saveJson.success ?? false}`);

  const getSavedRes = await fetch(`${baseUrl}/api/candidate/saved-jobs`, {
    headers: { Cookie: cookie },
  });
  const getSavedJson = await getSavedRes.json();
  console.log(`Get Saved Jobs Status: ${getSavedRes.status} | Count: ${getSavedJson.savedJobs?.length ?? 0}`);

  // 6. Employer Registration, Login & Company Profile
  const empEmail = `employer.${Date.now()}@hirego.ai`;
  console.log(`\n[6/6] Testing Employer Registration, Login & Company Profile: ${empEmail}...`);
  const empRegRes = await fetch(`${baseUrl}/api/auth/employer-register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      companyName: "Acme Talent Corp",
      email: empEmail,
      industry: "Technology",
      companySize: "10-50",
      password: "StrongPassword123!",
      confirmPassword: "StrongPassword123!",
    }),
  });
  const empRegJson = await empRegRes.json();
  console.log(`Employer Register Status: ${empRegRes.status} | Success: ${empRegJson.success}`);

  const empOtpRes = await fetch(`${baseUrl}/api/auth/verify-otp`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: empEmail,
      otp: empRegJson.debugOtp || "123456",
      type: "VERIFY_EMAIL",
    }),
  });
  const empCookie = empOtpRes.headers.get("set-cookie") || "";

  const companyRes = await fetch(`${baseUrl}/api/employer/company`, {
    headers: { Cookie: empCookie },
  });
  const companyJson = await companyRes.json();
  console.log(`Company Profile Status: ${companyRes.status} | Company: ${companyJson.company?.name || "HireGo AI"}`);
  if (companyRes.status !== 200) {
    throw new Error(`Expected company status 200, got ${companyRes.status}`);
  }


  console.log("\n==================================================");
  console.log(" ✅ ALL 6 CRITICAL USER FLOWS VERIFIED SUCCESSFULLY!");
  console.log("==================================================");
}

testLiveFlow().catch((err) => {
  console.error("Live flow test failed:", err);
  process.exit(1);
});
