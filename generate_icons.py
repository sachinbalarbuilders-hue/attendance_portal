#!/usr/bin/env python3
"""
Simple icon generator for PWA
Creates basic colored squares as placeholder icons
"""

from PIL import Image, ImageDraw
import os

def create_icon(size, filename, color="#2563eb"):
    """Create a simple icon with the specified size and color"""
    # Create a new image with the specified size
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    # Draw a rounded rectangle
    margin = size // 8
    draw.rounded_rectangle(
        [margin, margin, size-margin, size-margin],
        radius=size//6,
        fill=color
    )
    
    # Add a simple "A" for Attendance
    try:
        # Try to use a default font
        from PIL import ImageFont
        font_size = size // 3
        font = ImageFont.truetype("arial.ttf", font_size)
    except:
        # Fallback to default font
        font = ImageFont.load_default()
    
    # Calculate text position
    text = "A"
    bbox = draw.textbbox((0, 0), text, font=font)
    text_width = bbox[2] - bbox[0]
    text_height = bbox[3] - bbox[1]
    x = (size - text_width) // 2
    y = (size - text_height) // 2
    
    # Draw the text
    draw.text((x, y), text, fill="white", font=font)
    
    # Save the image
    img.save(filename, "PNG")
    print(f"Created {filename} ({size}x{size})")

def main():
    """Generate all required icons"""
    # Ensure the icons directory exists
    os.makedirs("static/icons", exist_ok=True)
    
    # Icon sizes for PWA
    sizes = [72, 96, 128, 144, 152, 192, 384, 512]
    
    for size in sizes:
        filename = f"static/icons/icon-{size}x{size}.png"
        create_icon(size, filename)
    
    # Create additional icons for shortcuts
    create_icon(96, "static/icons/attendance-icon.png", "#10b981")
    create_icon(96, "static/icons/upload-icon.png", "#f59e0b")
    
    print("All icons generated successfully!")
    print("Note: These are placeholder icons. Replace with proper design for production.")

if __name__ == "__main__":
    try:
        from PIL import Image, ImageDraw, ImageFont
        main()
    except ImportError:
        print("PIL (Pillow) not installed. Installing...")
        import subprocess
        subprocess.run(["pip", "install", "Pillow"])
        from PIL import Image, ImageDraw, ImageFont
        main()
