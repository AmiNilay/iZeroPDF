/**
 * Images to PDF - UI Controller
 */

const ImageToPdfController = (function() {
    'use strict';

    let uploadedImages = [];
    let resultPdf = null;

    /**
     * Render the tool UI
     */
    function render() {
        const container = document.getElementById('toolContent');
        if (!container) return;

        container.innerHTML = `
            <section class="page active">
                <div class="tool-page">
                    <div class="tool-header">
                        <h2>🖼️ Images → PDF</h2>
                        <p>Convert multiple images into a single PDF document</p>
                    </div>

                    <div class="upload-area" id="imageUploadArea">
                        <input type="file" id="imageFileInput" accept="image/*" multiple>
                        <div class="upload-icon">📤</div>
                        <div class="upload-text">Drop your images here or click to browse</div>
                        <div class="upload-hint">Supports JPG, PNG, WebP, BMP, GIF</div>
                    </div>

                    <div id="imageList" style="margin: 10px 0; max-height: 200px; overflow-y: auto;"></div>

                    <div class="settings-group">
                        <label>
                            Page Size:
                            <select id="pageSizeSelect">
                                <option value="a4" selected>A4</option>
                                <option value="letter">Letter</option>
                                <option value="legal">Legal</option>
                                <option value="a3">A3</option>
                                <option value="a5">A5</option>
                            </select>
                        </label>
                        <label>
                            Orientation:
                            <select id="orientationSelect">
                                <option value="portrait" selected>Portrait</option>
                                <option value="landscape">Landscape</option>
                            </select>
                        </label>
                        <label>
                            Image Fit:
                            <select id="fitSelect">
                                <option value="contain" selected>Contain</option>
                                <option value="cover">Cover</option>
                                <option value="fill">Fill</option>
                            </select>
                        </label>
                        <label>
                            Quality:
                            <input type="range" id="pdfQualityRange" min="1" max="100" value="92">
                            <span id="pdfQualityLabel">92%</span>
                        </label>
                    </div>

                    <button class="btn btn-primary" id="createPdfBtn" disabled>
                        📄 Create PDF
                    </button>

                    <div class="progress-container">
                        <div class="progress-bar"></div>
                        <div class="progress-text"></div>
                    </div>

                    <div class="preview-area" id="imagesPreview">
                        <p style="text-align: center; color: #999; padding: 20px;">
                            Upload images to see preview
                        </p>
                    </div>

                    <div id="pdfDownloadSection" style="display: none; margin-top: 20px;">
                        <button class="btn btn-success" id="downloadPdfBtn">📥 Download PDF</button>
                        <span id="pdfSizeInfo" style="margin-left: 10px;"></span>
                    </div>
                </div>
            </section>
        `;

        attachEvents();
    }

    /**
     * Attach event listeners
     */
    function attachEvents() {
        const fileInput = document.getElementById('imageFileInput');
        const uploadArea = document.getElementById('imageUploadArea');
        const createBtn = document.getElementById('createPdfBtn');
        const qualityRange = document.getElementById('pdfQualityRange');
        const qualityLabel = document.getElementById('pdfQualityLabel');
        const downloadBtn = document.getElementById('downloadPdfBtn');

        // Quality range
        if (qualityRange && qualityLabel) {
            qualityRange.addEventListener('input', function() {
                qualityLabel.textContent = this.value + '%';
            });
        }

        // File input
        if (fileInput) {
            fileInput.addEventListener('change', function(e) {
                const files = Array.from(this.files);
                if (files.length > 0) {
                    addImages(files);
                }
            });
        }

        // Drag and drop
        if (uploadArea) {
            uploadArea.addEventListener('dragover', function(e) {
                e.preventDefault();
                this.classList.add('dragover');
            });

            uploadArea.addEventListener('dragleave', function(e) {
                e.preventDefault();
                this.classList.remove('dragover');
            });

            uploadArea.addEventListener('drop', function(e) {
                e.preventDefault();
                this.classList.remove('dragover');
                const files = Array.from(e.dataTransfer.files);
                addImages(files);
            });
        }

        // Create PDF
        if (createBtn) {
            createBtn.addEventListener('click', createPdf);
        }

        // Download PDF
        if (downloadBtn) {
            downloadBtn.addEventListener('click', downloadPdf);
        }
    }

    /**
     * Add images to the list
     */
    function addImages(files) {
        const validImages = files.filter(f => Validators.isImage(f));
        
        if (validImages.length === 0) {
            showToast('warning', 'No valid image files found');
            return;
        }

        uploadedImages = [...uploadedImages, ...validImages];
        updateImageList();
        updatePreview();
        
        const createBtn = document.getElementById('createPdfBtn');
        if (createBtn) createBtn.disabled = false;

        showToast('success', `Added ${validImages.length} images`);
    }

    /**
     * Update image list
     */
    function updateImageList() {
        const list = document.getElementById('imageList');
        if (!list) return;

        if (uploadedImages.length === 0) {
            list.innerHTML = '';
            return;
        }

        let html = '<div style="display: flex; flex-wrap: wrap; gap: 8px; padding: 8px;">';
        
        for (let i = 0; i < uploadedImages.length; i++) {
            const img = uploadedImages[i];
            html += `
                <div style="display: flex; align-items: center; gap: 8px; background: #f0f0f0; padding: 4px 12px; border-radius: 20px; font-size: 13px;">
                    <span>🖼️</span>
                    <span>${img.name}</span>
                    <span style="font-size: 11px; color: #999;">${FileHelpers.formatFileSize(img.size)}</span>
                    <button class="remove-image-btn" data-index="${i}" style="background: none; border: none; cursor: pointer; color: #c62828;">✕</button>
                </div>
            `;
        }
        
        html += '</div>';
        list.innerHTML = html;

        // Add remove handlers
        list.querySelectorAll('.remove-image-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const index = parseInt(this.dataset.index);
                uploadedImages.splice(index, 1);
                updateImageList();
                updatePreview();
                if (uploadedImages.length === 0) {
                    document.getElementById('createPdfBtn').disabled = true;
                }
            });
        });
    }

    /**
     * Update preview
     */
    function updatePreview() {
        const preview = document.getElementById('imagesPreview');
        if (!preview) return;

        if (uploadedImages.length === 0) {
            preview.innerHTML = '<p style="text-align: center; color: #999; padding: 20px;">Upload images to see preview</p>';
            return;
        }

        // Show thumbnails
        let html = '<div class="preview-grid">';
        
        for (let i = 0; i < Math.min(uploadedImages.length, 12); i++) {
            const img = uploadedImages[i];
            const url = URL.createObjectURL(img);
            html += `
                <div class="preview-item">
                    <img src="${url}" alt="${img.name}" style="width:100%;height:120px;object-fit:cover;">
                    <span class="page-number">${i + 1}</span>
                </div>
            `;
            setTimeout(() => URL.revokeObjectURL(url), 10000);
        }
        
        if (uploadedImages.length > 12) {
            html += `<div class="preview-item" style="display:flex;align-items:center;justify-content:center;background:#f5f5f5;">
                +${uploadedImages.length - 12} more
            </div>`;
        }
        
        html += '</div>';
        preview.innerHTML = html;
    }

    /**
     * Create PDF from images
     */
    async function createPdf() {
        if (uploadedImages.length === 0) {
            showToast('warning', 'Please add at least one image');
            return;
        }

        const createBtn = document.getElementById('createPdfBtn');
        createBtn.disabled = true;
        createBtn.textContent = '⏳ Creating...';

        try {
            const pageSize = document.getElementById('pageSizeSelect').value;
            const orientation = document.getElementById('orientationSelect').value;
            const fit = document.getElementById('fitSelect').value;
            const quality = parseInt(document.getElementById('pdfQualityRange').value) / 100;

            const pdf = await ImageProcessor.imagesToPDF(uploadedImages, {
                pageSize,
                orientation,
                fit,
                quality,
                margin: 10
            });

            resultPdf = pdf;
            
            // Show download section
            const downloadSection = document.getElementById('pdfDownloadSection');
            if (downloadSection) {
                downloadSection.style.display = 'block';
            }

            // Show PDF size
            const pdfBytes = pdf.output('arraybuffer');
            const sizeInfo = document.getElementById('pdfSizeInfo');
            if (sizeInfo) {
                sizeInfo.textContent = `PDF Size: ${FileHelpers.formatFileSize(pdfBytes.byteLength)}`;
            }

            showToast('success', `PDF created with ${uploadedImages.length} pages`);

        } catch (error) {
            console.error('PDF creation error:', error);
            showToast('error', `Failed to create PDF: ${error.message}`);
        } finally {
            createBtn.disabled = false;
            createBtn.textContent = '📄 Create PDF';
        }
    }

    /**
     * Download PDF
     */
    function downloadPdf() {
        if (!resultPdf) {
            showToast('warning', 'Please create a PDF first');
            return;
        }

        try {
            const pdfBlob = resultPdf.output('blob');
            DownloadHelpers.downloadBlob(pdfBlob, 'converted.pdf');
            showToast('success', 'PDF downloaded');
        } catch (error) {
            console.error('Download error:', error);
            showToast('error', `Download failed: ${error.message}`);
        }
    }

    // Public API
    return {
        render
    };

})();

// Make ImageToPdfController globally available
window.ImageToPdfController = ImageToPdfController;