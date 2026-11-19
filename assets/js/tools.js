
document.addEventListener("DOMContentLoaded", function () {
  // IMAGE RESIZER
  const resizeFile = document.getElementById("resizeFile");

  if (resizeFile) {
    let resizeImage = null;
    let resizeUrl = null;
    let originalWidth = 0;
    let originalHeight = 0;

    const controls = document.getElementById("resizeControls");
    const widthInput = document.getElementById("resizeWidth");
    const heightInput = document.getElementById("resizeHeight");
    const preview = document.getElementById("resizePreview");
    const download = document.getElementById("resizeDownload");
    const status = document.getElementById("resizeStatus");

    resizeFile.addEventListener("change", function () {
      const file = resizeFile.files[0];
      if (!file) return;

      if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
        status.textContent = "Please select a JPG, PNG or WebP image.";
        return;
      }

      if (resizeUrl) URL.revokeObjectURL(resizeUrl);
      resizeUrl = URL.createObjectURL(file);

      resizeImage = new Image();
      resizeImage.onload = function () {
        originalWidth = resizeImage.naturalWidth;
        originalHeight = resizeImage.naturalHeight;

        widthInput.value = originalWidth;
        heightInput.value = originalHeight;
        preview.src = resizeUrl;
        controls.classList.remove("hidden");
        download.classList.add("hidden");

        document.getElementById("resizeOriginalInfo").textContent =
          "Original dimensions: " + originalWidth + " × " + originalHeight + " pixels";

        status.textContent = "";
      };
      resizeImage.onerror = function () {
        status.textContent = "This image could not be opened.";
      };
      resizeImage.src = resizeUrl;
    });

    widthInput.addEventListener("input", function () {
      if (document.getElementById("lockRatio").checked && originalWidth) {
        const newWidth = Number(widthInput.value);
        if (newWidth > 0) {
          heightInput.value = Math.max(1, Math.round(newWidth * originalHeight / originalWidth));
        }
      }
    });

    heightInput.addEventListener("input", function () {
      if (document.getElementById("lockRatio").checked && originalHeight) {
        const newHeight = Number(heightInput.value);
        if (newHeight > 0) {
          widthInput.value = Math.max(1, Math.round(newHeight * originalWidth / originalHeight));
        }
      }
    });

    document.getElementById("resizeButton").addEventListener("click", function () {
      if (!resizeImage) return;

      const width = Number(widthInput.value);
      const height = Number(heightInput.value);

      if (!Number.isInteger(width) || !Number.isInteger(height) ||
          width < 1 || height < 1 || width > 12000 || height > 12000) {
        status.textContent = "Enter valid dimensions between 1 and 12,000 pixels.";
        return;
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext("2d");
      const mode = document.getElementById("resizeMode").value;
      const background = document.getElementById("resizeBg").value;

      ctx.fillStyle = background;
      ctx.fillRect(0, 0, width, height);

      if (mode === "stretch") {
        ctx.drawImage(resizeImage, 0, 0, width, height);
      } else {
        const scale = mode === "fill"
          ? Math.max(width / originalWidth, height / originalHeight)
          : Math.min(width / originalWidth, height / originalHeight);

        const drawWidth = originalWidth * scale;
        const drawHeight = originalHeight * scale;
        const x = (width - drawWidth) / 2;
        const y = (height - drawHeight) / 2;

        ctx.drawImage(resizeImage, x, y, drawWidth, drawHeight);
      }

      const format = document.getElementById("resizeFormat").value;

      canvas.toBlob(function (blob) {
        if (!blob) {
          status.textContent = "Could not create the resized image.";
          return;
        }

        if (download.dataset.url) URL.revokeObjectURL(download.dataset.url);

        const resultUrl = URL.createObjectURL(blob);
        download.href = resultUrl;
        download.dataset.url = resultUrl;

        const extension = format === "image/jpeg" ? "jpg" :
          format === "image/webp" ? "webp" : "png";

        download.download = "imagetool-resized." + extension;
        download.classList.remove("hidden");
        status.textContent = "Image resized successfully: " + width + " × " + height + " pixels.";
      }, format, 0.92);
    });
  }

  // IMAGE COMPRESSOR
  const compressFile = document.getElementById("compressFile");

  if (compressFile) {
    let sourceImage = null;
    let sourceUrl = null;
    let originalFile = null;
    let outputUrl = null;

    const controls = document.getElementById("compressControls");
    const quality = document.getElementById("compressQuality");
    const qualityValue = document.getElementById("qualityValue");
    const download = document.getElementById("compressDownload");
    const result = document.getElementById("compressResult");
    const status = document.getElementById("compressStatus");

    function formatSize(bytes) {
      if (bytes < 1024) return bytes + " B";
      if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
      return (bytes / (1024 * 1024)).toFixed(2) + " MB";
    }

    compressFile.addEventListener("change", function () {
      const file = compressFile.files[0];
      if (!file) return;

      if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
        status.textContent = "Please select a JPG, PNG or WebP image.";
        result.classList.remove("hidden");
        return;
      }

      originalFile = file;

      if (sourceUrl) URL.revokeObjectURL(sourceUrl);
      sourceUrl = URL.createObjectURL(file);

      sourceImage = new Image();
      sourceImage.onload = function () {
        document.getElementById("compressPreview").src = sourceUrl;
        document.getElementById("compressOriginalInfo").textContent =
          "Original file size: " + formatSize(file.size) +
          " | Dimensions: " + sourceImage.naturalWidth + " × " + sourceImage.naturalHeight;

        controls.classList.remove("hidden");
        result.classList.add("hidden");
        download.classList.add("hidden");
      };
      sourceImage.onerror = function () {
        status.textContent = "This image could not be opened.";
        result.classList.remove("hidden");
      };
      sourceImage.src = sourceUrl;
    });

    quality.addEventListener("input", function () {
      qualityValue.textContent = quality.value;
    });

    document.getElementById("compressButton").addEventListener("click", function () {
      if (!sourceImage || !originalFile) return;

      const format = document.getElementById("compressFormat").value;
      const qualityNumber = Number(quality.value) / 100;

      const canvas = document.createElement("canvas");
      canvas.width = sourceImage.naturalWidth;
      canvas.height = sourceImage.naturalHeight;

      const ctx = canvas.getContext("2d");

      // JPEG does not support transparency, so use a white background.
      if (format === "image/jpeg") {
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }

      ctx.drawImage(sourceImage, 0, 0);

      canvas.toBlob(function (blob) {
        if (!blob) {
          status.textContent = "Could not compress this image.";
          result.classList.remove("hidden");
          return;
        }

        if (outputUrl) URL.revokeObjectURL(outputUrl);
        outputUrl = URL.createObjectURL(blob);

        const extension = format === "image/jpeg" ? "jpg" :
          format === "image/webp" ? "webp" : "png";

        download.href = outputUrl;
        download.download = "imagetool-compressed." + extension;
        download.classList.remove("hidden");

        document.getElementById("compressOutputPreview").src = outputUrl;

        const difference = originalFile.size - blob.size;
        const percentage = originalFile.size > 0
          ? (difference / originalFile.size) * 100
          : 0;

        let message;

        if (difference > 0) {
          message = "File size reduced by " + percentage.toFixed(1) + "%.";
        } else if (difference < 0) {
          message = "The new file is larger. Try a different format or lower quality.";
        } else {
          message = "The new file is approximately the same size.";
        }

        status.textContent = message;

        document.getElementById("compressSizeInfo").textContent =
          "Original: " + formatSize(originalFile.size) +
          " | Compressed: " + formatSize(blob.size);

        result.classList.remove("hidden");
      }, format, format === "image/png" ? undefined : qualityNumber);
    });
  }
});
                                                             
