export default {
  extends: ['@commitlint/config-conventional'],
  // Grouped Dependabot commit bodies contain long release-note lines that
  // violate body-max-line-length; its subject is already conventional.
  ignores: [(message) => message.includes('Signed-off-by: dependabot[bot]')],
};
