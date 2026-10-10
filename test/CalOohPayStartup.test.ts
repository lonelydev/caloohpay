import { describe, expect, it, jest } from '@jest/globals';

describe('CalOohPay startup', () => {
    describe('given the CLI module loads the .env file', () => {
        it('should load it quietly so dotenv does not print its "injected env" banner on every run', () => {
            // Arrange
            const config = jest.fn();

            // Act
            jest.isolateModules(() => {
                jest.doMock('dotenv', () => ({ config }));
                // A synchronous require is needed to run the module's load-time side effects in isolation.
                // eslint-disable-next-line @typescript-eslint/no-require-imports
                require('../src/CalOohPay');
            });

            // Assert
            expect(config).toHaveBeenCalledWith({ quiet: true });
        });
    });
});
