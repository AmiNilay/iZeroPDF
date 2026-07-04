/**
 * Merge PDF - UI Controller
 */

const MergeToolController = (function() {
    'use strict';

    let uploadedPDFs = [];

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
                        <h2>📑 Merge PDF</h2>
                        <p>Combine multiple PDF files into a single document</p>
                    </div>

                    <div class="upload-area" id="mergeUploadArea">
                        <input type="file" id="mergeFileInput" accept=".pdf,application/pdf" multiple>
                        <div class="upload-icon">📤</div>
                        <div class="upload-text">Drop your PDFs here or click to browse</div>
                        <div class="upload-hint">Select multiple PDF files to merge</div>
                    </div>

                    <div id="pdfList" style="margin: 10px 0; max-height: 200px; overflow-y: auto;"></div>

                    <div class="settings-group">
                        <label>
                            Page Size:
                            <select id="mergePageSize">
                                <option value="">Auto (Use first PDF)</option>
                                <option value="a4">A4</option>
                                <option value="letter">Letter</option>
                                <option value="legal">Legal</option>
                                <option value="a3">A3</option>
                            </select>
                        </label>
                        <label>
                            <input type="checkbox" id="addPageNumbers"> Add Page Numbers
                        </label>
                        <label>
                            Page Number Position:
                            <select id="pageNumberPosition">
                                <option value="bottom-center">Bottom Center</option>
                                <option value="bottom-left">Bottom Left</option>
                                <option value="bottom-right">Bottom Right</option>
                                <option value="top-center">Top Center</option>
                                <option value="top-left">Top Left</option>
                                <option value="top-right">Top Right</option>
                            </select>
                        </label>
                    </div>

                    <button class="btn btn-primary" id="mergePdfBtn" disabled>
                        🔄 Merge PDFs
                    </button>

                    <div class="progress-container">
                        <div class="progress-bar"></div>
                        <div class="progress-text"></div>
                    </div>

                    <div id="mergeResult" style="display: none; margin-top: 20px;">
                        <button class="btn btn-success" id="downloadMergedBtn">📥 Download Merged PDF</button>
                        <span id="mergeInfo" style="margin-left: 10px;"></span>
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
        const fileInput = document.getElementById('mergeFileInput');
        const uploadArea = document.getElementById('mergeUploadArea');
        const mergeBtn = document.getElementById('mergePdfBtn');
        const downloadBtn = document.getElementById('downloadMergedBtn');

        // File input
        if (fileInput) {
            fileInput.addEventListener('change', function(e) {
                const files = Array.from(this.files);
                if (files.length > 0) {
                    addPDFs(files);
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
                addPDFs(files);
            });
        }

        // Merge
        if (mergeBtn) {
            mergeBtn.addEventListener('click', mergePDFs);
        }

        // Download
        if (downloadBtn) {
            downloadBtn.addEventListener('click', downloadMerged);
        }
    }

    /**
     * Add PDFs to list
     */
    function addPDFs(files) {
        const validPDFs = files.filter(f => Validators.isPDF(f));
        
        if (validPDFs.length === 0) {
            showToast('warning', 'No valid PDF files found');
            return;
        }

        uploadedPDFs = [...uploadedPDFs, ...validPDFs];
        updatePDFList();
        
        const mergeBtn = document.getElementById('mergePdfBtn');
        if (mergeBtn) mergeBtn.disabled = false;

        showToast('success', `Added ${validPDFs.length} PDFs`);
    }

    /**
     * Update PDF list
     */
    function updatePDFList() {
        const list = document.getElementById('pdfList');
        if (!list) return;

        if (uploadedPDFs.length === 0) {
            list.innerHTML = '';
            return;
        }

        let html = '<div style="padding: 8px;">';
        
        for (let i = 0; i < uploadedPDFs.length; i++) {
            const pdf = uploadedPDFs[i];
            html += `
                <div style="display: flex; align-items: center; gap: 12px; padding: 6px 12px; background: #f5f5f5; margin-bottom: 4px; border-radius: 6px;">
                    <span style="font-size: 18px;">📄</span>
                    <span style="flex: 1;">${pdf.name}</span>
                    <span style="font-size: 12px; color: #999;">${FileHelpers.formatFileSize(pdf.size)}</span>
                    <button class="remove-pdf-btn" data-index="${i}" style="background: none; border: none; cursor: pointer; color: #c62828;">✕</button>
                </div>
            `;
        }
        
        html += '</div>';
        list.innerHTML = html;

        // Add remove handlers
        list.querySelectorAll('.remove-pdf-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const index = parseInt(this.dataset.index);
                uploadedPDFs.splice(index, 1);
                updatePDFList();
                if (uploadedPDFs.length === 0) {
                    document.getElementById('mergePdfBtn').disabled = true;
                }
            });
        });
    }

    /**
     * Merge PDFs - Calls the core engine
     */
    async function mergePDFs() {
        if (uploadedPDFs.length < 2) {
            showToast('warning', 'Please add at least 2 PDF files');
            return;
        }

        const mergeBtn = document.getElementById('mergePdfBtn');
        mergeBtn.disabled = true;
        mergeBtn.textContent = '⏳ Merging...';

        try {
            const pageSize = document.getElementById('mergePageSize').value;
            const addPageNumbers = document.getElementById('addPageNumbers').checked;
            const pageNumberPosition = document.getElementById('pageNumberPosition').value;

            // ✅ Use MergeEngine from core
            const pdfBytes = await MergeEngine.mergePDFs(uploadedPDFs, {
                pageSize: pageSize || null,
                addPageNumbers,
                pageNumberPosition
            });

            // Store result
            window._mergedPdfBytes = pdfBytes;

            // Show download section
            const resultDiv = document.getElementById('mergeResult');
            if (resultDiv) {
                resultDiv.style.display = 'block';
            }

            const infoSpan = document.getElementById('mergeInfo');
            if (infoSpan) {
                infoSpan.textContent = `Size: ${FileHelpers.formatFileSize(pdfBytes.byteLength)}`;
            }

            showToast('success', `Successfully merged ${uploadedPDFs.length} PDFs`);

        } catch (error) {
            console.error('Merge error:', error);
            showToast('error', `Merge failed: ${error.message}`);
        } finally {
            mergeBtn.disabled = false;
            mergeBtn.textContent = '🔄 Merge PDFs';
        }
    }

    /**
     * Download merged PDF
     */
    function downloadMerged() {
        if (!window._mergedPdfBytes) {
            showToast('warning', 'Please merge PDFs first');
            return;
        }

        const blob = new Blob([window._mergedPdfBytes], { type: 'application/pdf' });
        DownloadHelpers.downloadBlob(blob, 'merged.pdf');
        showToast('success', 'Merged PDF downloaded');
    }

    // Public API
    return {
        render
    };

})();

// ✅ CORRECT: Make MergeToolController globally available
window.MergeToolController = MergeToolController;