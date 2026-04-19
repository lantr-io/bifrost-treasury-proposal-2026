declare module "libsodium-wrappers-sumo" {
  const sodium: { ready: Promise<void> } & Record<string, unknown>;
  export default sodium;
}
