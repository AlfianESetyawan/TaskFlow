fn main() {
  let env_path = std::path::Path::new(env!("CARGO_MANIFEST_DIR")).join("../.env");
  println!("cargo:rerun-if-changed={}", env_path.display());
  if let Ok(contents) = std::fs::read_to_string(env_path) {
    if let Some(secret) = contents.lines().find_map(|line| line.strip_prefix("GOOGLE_DESKTOP_CLIENT_SECRET=")) {
      let secret = secret.trim().trim_matches('"');
      if !secret.is_empty() {
        println!("cargo:rustc-env=GOOGLE_DESKTOP_CLIENT_SECRET={secret}");
      }
    }
  }
  tauri_build::build()
}
