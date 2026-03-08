export const getUserId = jest.fn().mockResolvedValue('test-user-id');
export const getAuthenticatedUser = jest.fn().mockResolvedValue({
  id: 'test-user-id',
  email: 'test@example.com',
  name: 'Test User',
  image: null,
});
