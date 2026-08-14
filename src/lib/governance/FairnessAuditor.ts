export class FairnessAuditor {
  private static biasedTerms = [
    'he', 'she', 'him', 'her', 'male', 'female', 'man', 'woman', 'gender', // Gender
    'young', 'old', 'elderly', 'youthful', 'recent graduate', 'digital native', // Age
    'normal', 'able-bodied', 'crazy', 'insane', 'handicapped', // Disability
    'single', 'married', 'divorced', 'family man', // Marital/Family
    'native english speaker', 'caucasian', 'minority', // Ethnicity/Origin
  ];

  public static audit(text: string): {
    fairnessChecked: boolean;
    policyCompliant: boolean;
    biasScore: number;
    flaggedTerms: string[];
  } {
    // Normalize Unicode (NFKD), strip zero-width/control characters, and convert homoglyphs
    const cleanedText = text
      .normalize('NFKD')
      .replace(/[\u200B-\u200D\uFEFF\u0000-\u001F]/g, '')
      .replace(/[\u0430]/g, 'a')
      .replace(/[\u0435]/g, 'e')
      .replace(/[\u043E]/g, 'o')
      .replace(/[\u0440]/g, 'p')
      .replace(/[\u0441]/g, 'c')
      .replace(/[\u0443]/g, 'y')
      .replace(/[\u0445]/g, 'x');

    const lowerText = cleanedText.toLowerCase();
    const flaggedTerms: string[] = [];

    for (const term of this.biasedTerms) {
      const regex = new RegExp(`\\b${term}\\b`, 'i');
      if (regex.test(lowerText)) {
        flaggedTerms.push(term);
      }
    }

    const penalty = flaggedTerms.length * 0.1;
    const biasScore = Math.min(penalty, 1.0);
    const policyCompliant = flaggedTerms.length === 0;

    return {
      fairnessChecked: true,
      policyCompliant,
      biasScore,
      flaggedTerms,
    };
  }
}
