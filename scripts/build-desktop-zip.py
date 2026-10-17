#!/usr/bin/env python3
import os
import shutil
import subprocess
import zipfile

def build_desktop_zip():
    print("[1/4] Menjalankan Vite build dengan base relative './'...")
    project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    os.chdir(project_root)

    # Pastikan direktori tujuan ada
    downloads_dir = os.path.join(project_root, "public", "downloads")
    os.makedirs(downloads_dir, exist_ok=True)

    # Jalankan vite build
    build_cmd = ["npx", "vite", "build", "--base=./"]
    subprocess.check_call(build_cmd)

    dist_dir = os.path.join(project_root, "dist")
    staging_dir = os.path.join(project_root, "dist-desktop-staging")
    if os.path.exists(staging_dir):
        shutil.rmtree(staging_dir)
    os.makedirs(staging_dir, exist_ok=True)

    inner_folder = os.path.join(staging_dir, "Escape-The-Police-Desktop")
    os.makedirs(inner_folder, exist_ok=True)

    print("[2/4] Menyalin file-file game ke staging...")
    # Salin isi dist ke inner_folder
    for item in os.listdir(dist_dir):
        s = os.path.join(dist_dir, item)
        d = os.path.join(inner_folder, item)
        if os.path.isdir(s):
            shutil.copytree(s, d)
        else:
            shutil.copy2(s, d)

    # Salin juga folder maps dan difficulties jika belum ada
    public_dir = os.path.join(project_root, "public")
    for extra_dir in ["maps", "difficulties"]:
        src_extra = os.path.join(public_dir, extra_dir)
        dst_extra = os.path.join(inner_folder, extra_dir)
        if os.path.exists(src_extra) and not os.path.exists(dst_extra):
            shutil.copytree(src_extra, dst_extra)

    # Salin logo dan icon
    for icon_name in ["cyber_pursuit_logo.jpg", "favicon.ico", "apple-touch-icon.png"]:
        src_icon = os.path.join(public_dir, icon_name)
        dst_icon = os.path.join(inner_folder, icon_name)
        if os.path.exists(src_icon) and not os.path.exists(dst_icon):
            shutil.copy2(src_icon, dst_icon)

    print("[3/4] Membuat launcher Buka-Game-Windows.bat & dokumentasi...")
    bat_content = r"""@echo off
setlocal
title Escape the Police: Cyber Pursuit
color 0b

echo ============================================================
echo   ESCAPE THE POLICE: CYBER PURSUIT - PORTABLE EDITION
echo ============================================================
echo.
echo   Sedang membuka game di komputer Anda...
echo.

set "GAME_DIR=%~dp0"
set "HTML_FILE=%GAME_DIR%index.html"

powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "$port = 32800 + (Get-Random -Maximum 5000); ^
   $dir = '%GAME_DIR%'; ^
   $listener = New-Object System.Net.HttpListener; ^
   $listener.Prefixes.Add('http://127.0.0.1:' + $port + '/'); ^
   $listener.Start(); ^
   $url = 'http://127.0.0.1:' + $port + '/index.html'; ^
   $edge32 = \"${env:ProgramFiles(x86)}\Microsoft\Edge\Application\msedge.exe\"; ^
   $edge64 = \"$env:ProgramFiles\Microsoft\Edge\Application\msedge.exe\"; ^
   $chrome = \"$env:ProgramFiles\Google\Chrome\Application\chrome.exe\"; ^
   $chrome32 = \"${env:ProgramFiles(x86)}\Google\Chrome\Application\chrome.exe\"; ^
   if (Test-Path $edge32) { Start-Process $edge32 -ArgumentList \"--app=$url\" } ^
   elseif (Test-Path $edge64) { Start-Process $edge64 -ArgumentList \"--app=$url\" } ^
   elseif (Test-Path $chrome) { Start-Process $chrome -ArgumentList \"--app=$url\" } ^
   elseif (Test-Path $chrome32) { Start-Process $chrome32 -ArgumentList \"--app=$url\" } ^
   else { Start-Process $url }; ^
   Write-Host 'Game aktif! Biarkan jendela ini terbuka selama bermain.'; ^
   while ($listener.IsListening) { ^
     $context = $listener.GetContext(); ^
     $req = $context.Request; ^
     $res = $context.Response; ^
     $path = $req.Url.LocalPath.TrimStart('/'); ^
     if (-not $path) { $path = 'index.html' }; ^
     $filePath = Join-Path $dir $path; ^
     if (Test-Path $filePath) { ^
       $bytes = [System.IO.File]::ReadAllBytes($filePath); ^
       $ext = [System.IO.Path]::GetExtension($filePath).ToLower(); ^
       $ct = 'application/octet-stream'; ^
       if ($ext -eq '.html') { $ct = 'text/html; charset=utf-8' } ^
       elseif ($ext -eq '.js') { $ct = 'application/javascript; charset=utf-8' } ^
       elseif ($ext -eq '.css') { $ct = 'text/css; charset=utf-8' } ^
       elseif ($ext -eq '.png') { $ct = 'image/png' } ^
       elseif ($ext -eq '.jpg' -or $ext -eq '.jpeg') { $ct = 'image/jpeg' } ^
       elseif ($ext -eq '.ico') { $ct = 'image/x-icon' } ^
       elseif ($ext -eq '.svg') { $ct = 'image/svg+xml' } ^
       elseif ($ext -eq '.json') { $ct = 'application/json' }; ^
       $res.ContentType = $ct; ^
       $res.ContentLength64 = $bytes.Length; ^
       $res.OutputStream.Write($bytes, 0, $bytes.Length); ^
     } else { ^
       $res.StatusCode = 404; ^
     }; ^
     $res.OutputStream.Close(); ^
   }"

if errorlevel 1 (
    echo Membuka langsung via browser...
    start "" "%HTML_FILE%"
)
"""

    sh_content = r"""#!/bin/bash
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
echo "Membuka Escape the Police: Cyber Pursuit..."
if which open > /dev/null 2>&1; then
    open "$DIR/index.html"
elif which xdg-open > /dev/null 2>&1; then
    xdg-open "$DIR/index.html"
else
    python3 -m http.server 8080 --directory "$DIR" &
    sleep 1
    if which xdg-open > /dev/null 2>&1; then
        xdg-open "http://localhost:8080"
    fi
fi
"""

    readme_content = r"""================================================================================
       PANDUAN MEMASANG & MEMAINKAN GAME ESCAPE THE POLICE (OFFLINE)
================================================================================

Terima kasih telah mengunduh Escape the Police: Cyber Pursuit!
Game ini dapat dimainkan 100% secara offline tanpa kuota atau internet.

--------------------------------------------------------------------------------
CARA MEMASANG & MEMAINKAN DI LAPTOP / KOMPUTER (WINDOWS):
--------------------------------------------------------------------------------
1. Ekstrak (Extract) seluruh isi file ZIP ini ke folder yang Anda inginkan
   (misalnya di Desktop atau folder Dokumen Anda).

2. Buka folder hasil ekstrak "Escape-The-Police-Desktop", lalu klik dua kali pada:
   👉 "Buka-Game-Windows.bat"

3. Game akan langsung terbuka di layar penuh komputer Anda layaknya aplikasi
   PC asli! Semua progres, skor, dan mobil yang Anda pilih akan otomatis
   tersimpan di komputer Anda.

--------------------------------------------------------------------------------
UNTUK PENGGUNA MAC ATAU LINUX:
--------------------------------------------------------------------------------
- Cukup klik dua kali pada file "index.html" di dalam folder ini, atau
- Buka terminal dan jalankan: bash Buka-Game-Mac-Linux.sh

--------------------------------------------------------------------------------
FITUR PORTABEL GAME OFFLINE:
--------------------------------------------------------------------------------
✓ 100% Offline Ready (Dapat dimainkan tanpa internet)
✓ Performa Tinggi 60 FPS
✓ Suara & Musik Retro Cyberpunk Otentik
✓ Simpan Skor & Riwayat Garasi Mobil secara Lokal
✓ Bebas dimainkan kapan saja tanpa perlu buka web browser lagi

Selamat bermain dan selamat melarikan diri dari armada polisi Cyber Pursuit!
================================================================================
"""

    with open(os.path.join(inner_folder, "Buka-Game-Windows.bat"), "w", encoding="utf-8") as f:
        f.write(bat_content)

    with open(os.path.join(inner_folder, "Buka-Game-Mac-Linux.sh"), "w", encoding="utf-8") as f:
        f.write(sh_content)
    os.chmod(os.path.join(inner_folder, "Buka-Game-Mac-Linux.sh"), 0o755)

    with open(os.path.join(inner_folder, "PETUNJUK-CARA-MAIN.txt"), "w", encoding="utf-8") as f:
        f.write(readme_content)

    zip_path = os.path.join(downloads_dir, "EscapeThePolice-Offline-PC.zip")
    print(f"[4/4] Mengompres ke {zip_path}...")
    if os.path.exists(zip_path):
        os.remove(zip_path)

    with zipfile.ZipFile(zip_path, "w", zipfile.ZIP_DEFLATED) as zipf:
        for root, dirs, files in os.walk(staging_dir):
            for file in files:
                file_path = os.path.join(root, file)
                arcname = os.path.relpath(file_path, staging_dir)
                zipf.write(file_path, arcname)

    # Bersihkan staging
    shutil.rmtree(staging_dir)
    zip_size_mb = os.path.getsize(zip_path) / (1024 * 1024)
    print(f"BERHASIL! File ZIP terbuat: {zip_path} ({zip_size_mb:.2f} MB)")

if __name__ == "__main__":
    build_desktop_zip()
