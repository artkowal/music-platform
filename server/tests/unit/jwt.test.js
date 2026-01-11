const { createToken } = require('../../utils/jwt');
const jwt = require('jsonwebtoken');

process.env.JWT_SECRET = 'test_secret';

describe('JWT Utility', () => {
  test('powinien wygenerować poprawny token zawierający ID tokena', () => {
    // Arrange
    const tokenId = 'unique-token-id-123';

    // Act
    const token = createToken(tokenId);
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Assert
    expect(token).toBeDefined();
    expect(decoded.id).toBe(tokenId); // Sprawdzamy czy ID w tokenie to to samo, co podaliśmy
  });
});