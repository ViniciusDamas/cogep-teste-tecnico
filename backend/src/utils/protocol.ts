export function generateProtocol(): string {
  const year = new Date().getFullYear();
  const rand = Math.floor(100000 + Math.random() * 900000);
  return `REURB-${year}-${rand}`;
}
