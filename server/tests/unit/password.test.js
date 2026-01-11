const { hashPassword, comparePassword } = require('../../utils/password');

describe('Password Utility', () => {
  test('powinien poprawnie zahaszować hasło', async () => {
    // Arrange
    const plainPassword = 'mojeSekretneHaslo123';

    // Act 
    const hashedPassword = await hashPassword(plainPassword);

    // Assert 
    expect(hashedPassword).not.toBe(plainPassword);
    expect(hashedPassword).toBeDefined();
  });

  test('powinien poprawnie zweryfikować zgodność hasła', async () => {
    // Given
    const plainPassword = 'admin';
    const hashedPassword = await hashPassword(plainPassword);

    // When
    const isMatch = await comparePassword(plainPassword, hashedPassword);

    // Then 
    expect(isMatch).toBe(true);
  });
});