/** Downscale a photo to at most `maxSide` px and re-encode as JPEG so uploads stay small on mobile data. */
export async function compressImage(file, maxSide = 1600, quality = 0.82) {
    if (typeof createImageBitmap === "undefined" || !file.type.startsWith("image/"))
        return file;
    try {
        const bmp = await createImageBitmap(file);
        const scale = Math.min(1, maxSide / Math.max(bmp.width, bmp.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(bmp.width * scale);
        canvas.height = Math.round(bmp.height * scale);
        canvas.getContext("2d")?.drawImage(bmp, 0, 0, canvas.width, canvas.height);
        bmp.close();
        const blob = await new Promise((res) => canvas.toBlob(res, "image/jpeg", quality));
        if (!blob || blob.size >= file.size)
            return file;
        return new File([blob], file.name.replace(/\.\w+$/, "") + ".jpg", { type: "image/jpeg" });
    }
    catch {
        return file;
    }
}
