// Simple test to validate referral code generation
import { referralDb } from "./src/lib/referral-db";

async function testReferralCodeGeneration() {
  console.log('Testing referral code generation...');
  
  try {
    // Test 1: Check if referralDb is properly exported
    console.log('1. Checking referralDb export:', typeof referralDb);
    
    // Test 2: Test resolveReferralCode method
    const testCode = 'HIREGO2026';
    const referrerId = await referralDb.resolveReferralCode(testCode);
    console.log('2. Testing resolveReferralCode:', { testCode, referrerId });
    
    // Test 3: Test createAttribution method
    const attribution = await referralDb.createAttribution({
      referrerId: 'test-user-123',
      referralCode: 'TESTCODE2026',
      attributionSource: 'TEST',
      userType: 'CANDIDATE'
    });
    console.log('3. Testing createAttribution:', attribution);
    
    // Test 4: Test resolveCanonicalAttribution
    const canonical = await referralDb.resolveCanonicalAttribution({
      userId: 'test-user-123'
    });
    console.log('4. Testing resolveCanonicalAttribution:', canonical);
    
    console.log('\n✅ All tests completed successfully!');
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error('Stack:', error.stack);
  }
}

testReferralCodeGeneration();
