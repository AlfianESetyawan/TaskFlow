use base64::{engine::general_purpose::STANDARD, Engine as _};
use minisign_verify::{PublicKey, Signature};

fn main() -> Result<(), Box<dyn std::error::Error>> {
    let args: Vec<String> = std::env::args().collect();
    if args.len() != 3 { return Err("Usage: verify_update <latest.json> <installer>".into()); }
    let manifest: serde_json::Value = serde_json::from_slice(&std::fs::read(&args[1])?)?;
    let config: serde_json::Value = serde_json::from_str(include_str!("../tauri.conf.json"))?;
    if manifest["version"] != config["version"] { return Err("Manifest and app versions differ".into()); }
    let public_text = String::from_utf8(STANDARD.decode(config["plugins"]["updater"]["pubkey"].as_str().ok_or("Missing public key")?)?)?;
    let signature_text = String::from_utf8(STANDARD.decode(manifest["platforms"]["windows-x86_64"]["signature"].as_str().ok_or("Missing signature")?)?)?;
    let public_key = PublicKey::decode(&public_text)?;
    let signature = Signature::decode(&signature_text)?;
    let mut bytes = std::fs::read(&args[2])?;
    public_key.verify(&bytes, &signature, true)?;
    let version = manifest["version"].as_str().ok_or("Missing version")?;
    let signed_version = signature.trusted_comment().split('\t').find_map(|field| field.strip_prefix("version:"));
    if signed_version != Some(version) { return Err("Installer signature does not bind the manifest version".into()); }
    if bytes.is_empty() { return Err("Installer is empty".into()); }
    bytes[0] ^= 1;
    if public_key.verify(&bytes, &signature, true).is_ok() { return Err("Tampered installer was accepted".into()); }
    println!("Verified installer signature against the app's trusted public key; tampered bytes rejected.");
    Ok(())
}
