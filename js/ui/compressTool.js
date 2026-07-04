/**
 * Compress Tool - UI Controller with Size Presets
 */

const CompressToolController = (function() {
    'use strict';

    let currentFile = null;
    let compressedResult = null;
    let currentFileType = null; // 'pdf' or 'image'
    let isCompressing = false;

    // Size presets in KB
    const SIZE_PRESETS = [
        { label: '10 KB', value: 10 },
        { label: '20 KB', value: 20 },
        { label: '30 KB', value: 30 },
        { label: '40 KB', value: 40 },
        { label: '50 KB', value: 50 },
        { label: '60 KB', value: 60 },
        { label: '70 KB', value: 70 },
        { label: '80 KB', value: 80 },
        { label: '90 KB', value: 90 },
        { label: '100 KB', value: 100 },
        { label: '200 KB', value: 200 },
        { label: '500 KB', value: 500 },
        { label: '1 MB', value: 1024 }
    ];

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
                        <h2>📦 Compress Files</h2>
                        <p>Reduce file size for PDFs and images</p>
                    </div>

                    <div class="upload-area" id="compressUploadArea">
                        <input type="file" id="compressFileInput" accept=".pdf,application/pdf,image/*">
                        <div class="upload-icon">📤</div>
                        <div class="upload-text">Drop a PDF or image here or click to browse</div>
                        <div class="upload-hint">Supports PDF, JPG, PNG, WebP</div>
                    </div>

                    <div id="compressFileInfo" style="margin: 10px 0; display: none;">
                        <span id="compressFileDetails"></span>
                    </div>

                    <!-- Compression Mode Selection -->
                    <div class="settings-group" style="flex-direction: column; align-items: stretch;">
                        <label style="font-weight: 600; color: var(--md-on-surface); margin-bottom: 8px;">
                            📊 Compression Mode
                        </label>
                        <div style="display: flex; flex-wrap: wrap; gap: 8px;">
                            <button class="btn btn-primary btn-sm compression-mode active" data-mode="quality">
                                🎯 Quality Based
                            </button>
                            <button class="btn btn-secondary btn-sm compression-mode" data-mode="size">
                                📏 Target Size
                            </button>
                        </div>
                    </div>

                    <!-- Quality Based Settings -->
                    <div id="qualitySettings" class="settings-group">
                        <label>
                            Compression Level:
                            <select id="compressLevel">
                                <option value="lossless">🟢 Lossless (Best Quality)</option>
                                <option value="balanced" selected>🟡 Balanced (Recommended)</option>
                                <option value="maximum">🔴 Maximum (Smallest size)</option>
                            </select>
                        </label>
                        <label id="imageQualityLabel">
                            Quality:
                            <input type="range" id="compressQuality" min="10" max="100" value="80">
                            <span id="qualityValue">80%</span>
                        </label>
                    </div>

                    <!-- Target Size Settings -->
                    <div id="sizeSettings" class="settings-group" style="display: none;">
                        <label style="font-weight: 600; color: var(--md-on-surface); width: 100%; margin-bottom: 8px;">
                            🎯 Target File Size
                        </label>
                        
                        <!-- Size Preset Buttons -->
                        <div style="display: flex; flex-wrap: wrap; gap: 6px; width: 100%; margin-bottom: 12px;">
                            ${SIZE_PRESETS.map(preset => `
                                <button class="btn btn-secondary btn-sm size-preset-btn" data-size="${preset.value}">
                                    ${preset.label}
                                </button>
                            `).join('')}
                        </div>
                        
                        <!-- Custom Size Input -->
                        <div style="display: flex; align-items: center; gap: 12px; width: 100%; flex-wrap: wrap;">
                            <label style="font-weight: 500;">
                                Custom Size:
                                <input type="number" id="targetSizeInput" min="1" max="10240" value="50" style="width: 100px;">
                                <select id="targetSizeUnit" style="width: 80px;">
                                    <option value="KB">KB</option>
                                    <option value="MB">MB</option>
                                </select>
                            </label>
                            <button class="btn btn-primary btn-sm" id="applyTargetSizeBtn">Apply Size</button>
                        </div>
                        
                        <div style="width: 100%; margin-top: 8px; padding: 8px 12px; background: var(--md-surface-variant); border-radius: var(--md-shape-small); font-size: 0.85rem; color: var(--md-on-surface-variant);">
                            💡 <span id="sizeEstimateText">Select a preset or enter a custom target size</span>
                        </div>
                    </div>

                    <div class="settings-group">
                        <label>
                            <input type="checkbox" id="autoOptimize" checked> Auto-optimize
                        </label>
                        <label id="resizeLabel">
                            <input type="checkbox" id="resizeImages"> Resize large images
                        </label>
                    </div>

                    <div id="resizeOptions" style="display: none; margin: 10px 0; padding: 12px 16px; background: var(--md-surface); border-radius: var(--md-shape-medium); border: 1px solid var(--md-outline-variant);">
                        <label>
                            Max Width:
                            <input type="number" id="maxWidth" value="1920" min="100" style="width:80px;">
                        </label>
                        <label>
                            Max Height:
                            <input type="number" id="maxHeight" value="1080" min="100" style="width:80px;">
                        </label>
                    </div>

                    <button class="btn btn-primary" id="compressBtn" disabled>
                        📦 Compress
                    </button>

                    <div class="progress-container">
                        <div class="progress-bar"></div>
                        <div class="progress-text"></div>
                    </div>

                    <!-- Result Section -->
                    <div id="compressResult" style="display: none; margin-top: 20px;">
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 15px;">
                            <div style="background: var(--md-error-container); padding: 16px; border-radius: var(--md-shape-medium);">
                                <strong style="color: var(--md-on-error-container);">📄 Original</strong><br>
                                <span id="originalSizeDisplay" style="color: var(--md-on-error-container);"></span>
                                <br>
                                <span style="font-size: 0.85rem; color: var(--md-on-error-container); opacity: 0.7;" id="originalDimensions"></span>
                            </div>
                            <div style="background: var(--md-primary-container); padding: 16px; border-radius: var(--md-shape-medium);">
                                <strong style="color: var(--md-on-primary-container);">📦 Compressed</strong><br>
                                <span id="compressedSizeDisplay" style="color: var(--md-on-primary-container);"></span>
                                <br>
                                <span id="compressionReduction" style="color: var(--md-on-primary-container); font-weight: bold;"></span>
                            </div>
                        </div>
                        
                        <!-- Size Comparison Bar -->
                        <div style="margin-bottom: 15px; background: var(--md-surface-variant); border-radius: var(--md-shape-full); height: 20px; overflow: hidden; position: relative;">
                            <div id="sizeComparisonBar" style="height: 100%; background: var(--md-primary); transition: width 0.6s var(--md-easing-emphasized); width: 100%; border-radius: var(--md-shape-full);"></div>
                            <div style="position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; font-size: 0.7rem; font-weight: 600; color: var(--md-on-surface);">
                                <span id="sizeComparisonText">100%</span>
                            </div>
                        </div>
                        
                        <div style="display: flex; gap: 10px; flex-wrap: wrap;">
                            <button class="btn btn-success" id="downloadCompressedBtn">📥 Download Compressed</button>
                            <button class="btn btn-secondary" id="compressAgainBtn">🔄 Compress Again</button>
                        </div>
                    </div>

                    <!-- Preview Section -->
                    <div id="compressPreview" style="display: none; margin-top: 16px;">
                        <h4 style="color: var(--md-on-surface);">Preview</h4>
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
                            <div>
                                <p style="font-size: 0.85rem; color: var(--md-on-surface-variant);">Original</p>
                                <div id="originalPreview" style="border: 1px solid var(--md-outline-variant); border-radius: var(--md-shape-small); padding: 8px; min-height: 150px; display: flex; align-items: center; justify-content: center; background: var(--md-surface);">
                                    <p style="color: var(--md-on-surface-variant); font-size: 0.85rem;">No preview</p>
                                </div>
                            </div>
                            <div>
                                <p style="font-size: 0.85rem; color: var(--md-on-surface-variant);">Compressed</p>
                                <div id="compressedPreview" style="border: 1px solid var(--md-outline-variant); border-radius: var(--md-shape-small); padding: 8px; min-height: 150px; display: flex; align-items: center; justify-content: center; background: var(--md-surface);">
                                    <p style="color: var(--md-on-surface-variant); font-size: 0.85rem;">No preview</p>
                                </div>
                            </div>
                        </div>
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
        const fileInput = document.getElementById('compressFileInput');
        const uploadArea = document.getElementById('compressUploadArea');
        const compressBtn = document.getElementById('compressBtn');
        const downloadBtn = document.getElementById('downloadCompressedBtn');
        const compressAgainBtn = document.getElementById('compressAgainBtn');
        const levelSelect = document.getElementById('compressLevel');
        const qualityRange = document.getElementById('compressQuality');
        const qualityLabel = document.getElementById('qualityValue');
        const resizeCheck = document.getElementById('resizeImages');
        const resizeOptions = document.getElementById('resizeOptions');
        const targetSizeInput = document.getElementById('targetSizeInput');
        const applyTargetSizeBtn = document.getElementById('applyTargetSizeBtn');

        // Compression mode toggle
        document.querySelectorAll('.compression-mode').forEach(btn => {
            btn.addEventListener('click', function() {
                document.querySelectorAll('.compression-mode').forEach(b => b.classList.remove('active'));
                this.classList.add('active');
                
                const mode = this.dataset.mode;
                document.getElementById('qualitySettings').style.display = mode === 'quality' ? 'flex' : 'none';
                document.getElementById('sizeSettings').style.display = mode === 'size' ? 'flex' : 'none';
                
                // Update UI
                if (mode === 'size') {
                    showToast('info', 'Select a target size preset or enter custom size');
                }
            });
        });

        // Size preset buttons
        document.querySelectorAll('.size-preset-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const size = parseInt(this.dataset.size);
                document.querySelectorAll('.size-preset-btn').forEach(b => b.classList.remove('active'));
                this.classList.add('active');
                
                targetSizeInput.value = size;
                document.getElementById('targetSizeUnit').value = 'KB';
                
                // Update estimate
                updateSizeEstimate(size, 'KB');
                showToast('info', `Target size set to ${size} KB`);
            });
        });

        // Apply target size
        if (applyTargetSizeBtn) {
            applyTargetSizeBtn.addEventListener('click', function() {
                const size = parseInt(targetSizeInput.value);
                const unit = document.getElementById('targetSizeUnit').value;
                
                if (isNaN(size) || size < 1) {
                    showToast('error', 'Please enter a valid size');
                    return;
                }
                
                // Clear preset selection
                document.querySelectorAll('.size-preset-btn').forEach(b => b.classList.remove('active'));
                
                updateSizeEstimate(size, unit);
                showToast('info', `Target size set to ${size} ${unit}`);
            });
        }

        // Quality range
        if (qualityRange && qualityLabel) {
            qualityRange.addEventListener('input', function() {
                qualityLabel.textContent = this.value + '%';
            });
        }

        // Resize checkbox
        if (resizeCheck && resizeOptions) {
            resizeCheck.addEventListener('change', function() {
                resizeOptions.style.display = this.checked ? 'block' : 'none';
            });
        }

        // File input
        if (fileInput) {
            fileInput.addEventListener('change', function(e) {
                const file = this.files[0];
                if (file) {
                    handleFile(file);
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
                const file = e.dataTransfer.files[0];
                if (file) {
                    handleFile(file);
                }
            });
        }

        // Compress
        if (compressBtn) {
            compressBtn.addEventListener('click', compressFile);
        }

        // Download
        if (downloadBtn) {
            downloadBtn.addEventListener('click', downloadCompressed);
        }

        // Compress Again
        if (compressAgainBtn) {
            compressAgainBtn.addEventListener('click', function() {
                document.getElementById('compressResult').style.display = 'none';
                document.getElementById('compressPreview').style.display = 'none';
                compressedResult = null;
                document.getElementById('compressBtn').disabled = false;
                showToast('info', 'Ready to compress again');
            });
        }

        // Level change
        if (levelSelect) {
            levelSelect.addEventListener('change', function() {
                const isLossless = this.value === 'lossless';
                if (qualityRange) {
                    qualityRange.disabled = isLossless;
                    if (isLossless) {
                        qualityRange.value = 100;
                        qualityLabel.textContent = '100%';
                    }
                }
            });
        }
    }

    /**
     * Update size estimate
     */
    function updateSizeEstimate(size, unit) {
        const text = document.getElementById('sizeEstimateText');
        if (!text) return;
        
        const sizeInKB = unit === 'MB' ? size * 1024 : size;
        text.textContent = `Target: ${size} ${unit} (${sizeInKB} KB) - The compressor will try to achieve this file size`;
    }

    /**
     * Handle file upload
     */
    function handleFile(file) {
        const isPDF = Validators.isPDF(file);
        const isImage = Validators.isImage(file);

        if (!isPDF && !isImage) {
            showToast('error', 'Please upload a PDF or image file');
            return;
        }

        if (!Validators.checkFileSize(file, 100)) {
            showToast('error', 'File is too large. Maximum size is 100MB');
            return;
        }

        currentFile = file;
        currentFileType = isPDF ? 'pdf' : 'image';
        
        const compressBtn = document.getElementById('compressBtn');
        if (compressBtn) compressBtn.disabled = false;

        // Show file info
        const infoDiv = document.getElementById('compressFileInfo');
        const details = document.getElementById('compressFileDetails');
        if (infoDiv && details) {
            infoDiv.style.display = 'block';
            const typeIcon = isPDF ? '📄' : '🖼️';
            details.textContent = `${typeIcon} ${file.name} (${FileHelpers.formatFileSize(file.size)})`;
        }

        // Show/hide settings based on file type
        const qualityLabel = document.getElementById('imageQualityLabel');
        const resizeLabel = document.getElementById('resizeLabel');
        if (isPDF) {
            if (qualityLabel) qualityLabel.style.display = 'none';
            if (resizeLabel) resizeLabel.style.display = 'none';
        } else {
            if (qualityLabel) qualityLabel.style.display = 'block';
            if (resizeLabel) resizeLabel.style.display = 'block';
        }

        // Show original preview for images
        if (isImage) {
            const preview = document.getElementById('originalPreview');
            if (preview) {
                const url = URL.createObjectURL(file);
                preview.innerHTML = `<img src="${url}" style="max-width:100%;max-height:200px;border-radius:var(--md-shape-small);">`;
                setTimeout(() => URL.revokeObjectURL(url), 5000);
            }
            document.getElementById('compressPreview').style.display = 'block';
        }

        // Hide previous result
        document.getElementById('compressResult').style.display = 'none';
        compressedResult = null;

        showToast('success', `Loaded ${file.name}`);
    }

    /**
     * Estimate quality for target size
     */
    function estimateQualityForTarget(originalSize, targetSizeKB) {
        const targetBytes = targetSizeKB * 1024;
        const ratio = targetBytes / originalSize;
        
        // Clamp ratio between 0.05 and 0.95
        const clampedRatio = Math.max(0.05, Math.min(0.95, ratio));
        
        // Convert ratio to quality (0-100)
        let quality = Math.round(clampedRatio * 100);
        
        // Adjust for different file types
        if (currentFileType === 'pdf') {
            quality = Math.max(20, Math.min(95, quality));
        } else {
            quality = Math.max(10, Math.min(98, quality));
        }
        
        return quality;
    }

    /**
     * Compress the file
     */
    async function compressFile() {
        if (!currentFile) {
            showToast('warning', 'Please upload a file first');
            return;
        }

        if (isCompressing) return;
        isCompressing = true;

        const compressBtn = document.getElementById('compressBtn');
        compressBtn.disabled = true;
        compressBtn.textContent = '⏳ Compressing...';

        try {
            // Check which mode is active
            const activeMode = document.querySelector('.compression-mode.active');
            const mode = activeMode ? activeMode.dataset.mode : 'quality';
            
            const level = document.getElementById('compressLevel').value;
            let quality = parseInt(document.getElementById('compressQuality').value);
            const autoOptimize = document.getElementById('autoOptimize').checked;
            const resize = document.getElementById('resizeImages').checked;
            
            let result;

            if (currentFileType === 'pdf') {
                // PDF Compression
                const strategy = level === 'lossless' ? 'lossless' : 
                                level === 'balanced' ? 'balanced' : 'maximum';
                
                let effectiveStrategy = strategy;
                if (mode === 'size') {
                    const targetSize = parseInt(document.getElementById('targetSizeInput').value);
                    const unit = document.getElementById('targetSizeUnit').value;
                    const targetSizeKB = unit === 'MB' ? targetSize * 1024 : targetSize;
                    
                    const estimatedQuality = estimateQualityForTarget(currentFile.size, targetSizeKB);
                    quality = Math.min(100, Math.max(10, estimatedQuality));
                    
                    if (quality >= 85) effectiveStrategy = 'lossless';
                    else if (quality >= 60) effectiveStrategy = 'balanced';
                    else effectiveStrategy = 'maximum';
                }

                const compressionResult = await CompressEngine.compressPDF(currentFile, {
                    strategy: effectiveStrategy,
                    imageQuality: quality,
                    removeMetadata: !autoOptimize,
                    optimizeImages: autoOptimize
                });

                const blob = new Blob([compressionResult.pdfBytes], { type: 'application/pdf' });
                const filename = `${FileHelpers.getFileNameWithoutExtension(currentFile.name)}_compressed.pdf`;
                const newFile = new File([blob], filename, { type: 'application/pdf' });

                result = {
                    file: newFile,
                    blob,
                    originalSize: compressionResult.originalSize,
                    compressedSize: compressionResult.compressedSize,
                    reduction: compressionResult.reduction,
                    isPDF: true
                };

            } else {
                // Image Compression
                const maxWidth = resize ? parseInt(document.getElementById('maxWidth').value) : null;
                const maxHeight = resize ? parseInt(document.getElementById('maxHeight').value) : null;
                
                let compressionResult;
                
                if (mode === 'size') {
                    // Use target size compression
                    const targetSize = parseInt(document.getElementById('targetSizeInput').value);
                    const unit = document.getElementById('targetSizeUnit').value;
                    const targetSizeKB = unit === 'MB' ? targetSize * 1024 : targetSize;
                    
                    compressionResult = await CompressEngine.compressToTargetSize(currentFile, targetSizeKB, {
                        maxWidth: maxWidth,
                        maxHeight: maxHeight,
                        format: 'auto',
                        minQuality: 10,
                        maxQuality: 98
                    });
                } else {
                    // Use quality based compression
                    compressionResult = await CompressEngine.compressImage(currentFile, {
                        quality: quality,
                        format: 'auto',
                        maxWidth: maxWidth,
                        maxHeight: maxHeight
                    });
                }

                result = {
                    file: compressionResult.file,
                    blob: compressionResult.blob,
                    originalSize: compressionResult.originalSize,
                    compressedSize: compressionResult.compressedSize,
                    reduction: compressionResult.reduction,
                    isPDF: false,
                    canvas: compressionResult.canvas,
                    width: compressionResult.width,
                    height: compressionResult.height,
                    achievedTarget: compressionResult.achieved
                };
            }

            compressedResult = result;

            // Show result
            const resultDiv = document.getElementById('compressResult');
            if (resultDiv) {
                resultDiv.style.display = 'block';
            }

            document.getElementById('originalSizeDisplay').textContent = 
                FileHelpers.formatFileSize(result.originalSize);
            
            document.getElementById('compressedSizeDisplay').textContent = 
                FileHelpers.formatFileSize(result.compressedSize);
            
            const reductionText = `Saved ${result.reduction.toFixed(1)}%`;
            document.getElementById('compressionReduction').textContent = reductionText;

            // Show dimensions if available
            if (result.width && result.height) {
                document.getElementById('originalDimensions').textContent = 
                    `${result.width}×${result.height}`;
            }

            // Update size comparison bar
            const ratio = result.originalSize > 0 ? (result.compressedSize / result.originalSize) * 100 : 100;
            document.getElementById('sizeComparisonBar').style.width = `${Math.min(100, ratio)}%`;
            document.getElementById('sizeComparisonText').textContent = 
                `${Math.round(100 - result.reduction)}% of original`;

            // Show compressed preview for images
            if (!result.isPDF && result.canvas) {
                const preview = document.getElementById('compressedPreview');
                if (preview) {
                    const dataURL = result.canvas.toDataURL('image/png');
                    preview.innerHTML = `<img src="${dataURL}" style="max-width:100%;max-height:200px;border-radius:var(--md-shape-small);">`;
                }
                document.getElementById('compressPreview').style.display = 'block';
            }

            // Check if target size was achieved
            if (mode === 'size') {
                const targetSize = parseInt(document.getElementById('targetSizeInput').value);
                const unit = document.getElementById('targetSizeUnit').value;
                const targetBytes = (unit === 'MB' ? targetSize * 1024 * 1024 : targetSize * 1024);
                
                const achieved = result.compressedSize <= targetBytes * 1.1; // Allow 10% tolerance
                if (achieved || result.achievedTarget) {
                    showToast('success', `✅ Achieved target size! Saved ${result.reduction.toFixed(1)}%`);
                } else {
                    showToast('warning', `⚠️ Best effort: ${FileHelpers.formatFileSize(result.compressedSize)} (target: ${FileHelpers.formatFileSize(targetBytes)})`);
                }
            } else {
                showToast('success', `Compressed! Saved ${result.reduction.toFixed(1)}%`);
            }

        } catch (error) {
            console.error('Compression error:', error);
            showToast('error', `Compression failed: ${error.message}`);
        } finally {
            isCompressing = false;
            compressBtn.disabled = false;
            compressBtn.textContent = '📦 Compress';
        }
    }

    /**
     * Download compressed file
     */
    function downloadCompressed() {
        if (!compressedResult) {
            showToast('warning', 'Please compress a file first');
            return;
        }

        DownloadHelpers.downloadBlob(compressedResult.blob, compressedResult.file.name);
        showToast('success', 'Downloaded compressed file');
    }

    // Public API
    return {
        render
    };

})();

// Make CompressToolController globally available
window.CompressToolController = CompressToolController;