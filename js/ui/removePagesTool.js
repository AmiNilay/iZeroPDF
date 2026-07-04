/**
 * Remove Pages - UI Controller
 */

const RemovePagesToolController = (function() {
    'use strict';

    let currentFile = null;
    let totalPages = 0;

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
                        <h2>🗑️ Remove Pages from PDF</h2>
                        <p>Delete specific pages from your PDF document</p>
                    </div>

                    <div class="upload-area" id="removeUploadArea">
                        <input type="file" id="removeFileInput" accept=".pdf,application/pdf">
                        <div class="upload-icon">📤</div>
                        <div class="upload-text">Drop a PDF here or click to browse</div>
                    </div>

                    <div id="removeFileInfo" style="margin: 10px 0; display: none;">
                        <span id="removeFileDetails"></span>
                    </div>

                    <div class="settings-group">
                        <label>
                            Pages to Remove:
                            <input type="text" id="removePages" placeholder="e.g., 1,3,5-8" style="width: 300px;">
                        </label>
                        <p style="font-size: 12px; color: #999;">Enter page numbers or ranges separated by commas</p>
                    </div>

                    <div class="settings-group">
                        <label>
                            <input type="checkbox" id="reverseSelection"> Reverse Selection (keep selected, remove rest)
                        </label>
                    </div>

                    <button class="btn btn-danger" id="removePagesBtn" disabled>
                        🗑️ Remove Pages
                    </button>

                    <div class="progress-container">
                        <div class="progress-bar"></div>
                        <div class="progress-text"></div>
                    </div>

                    <div id="removeResult" style="display: none; margin-top: 20px;">
                        <div style="background: #e8f5e9; padding: 15px; border-radius: 8px; margin-bottom: 15px;">
                            ✅ Pages removed successfully!
                            <div style="font-size: 13px; margin-top: 5px; color: #666;">
                                <span id="removedInfo"></span>
                            </div>
                        </div>
                        <button class="btn btn-success" id="downloadRemovedBtn">📥 Download PDF</button>
                    </div>

                    <div id="pageList" style="margin-top: 15px; max-height: 300px; overflow-y: auto;"></div>
                </div>
            </section>
        `;

        attachEvents();
    }

    /**
     * Attach event listeners
     */
    function attachEvents() {
        const fileInput = document.getElementById('removeFileInput');
        const uploadArea = document.getElementById('removeUploadArea');
        const removeBtn = document.getElementById('removePagesBtn');
        const downloadBtn = document.getElementById('downloadRemovedBtn');

        // File input
        if (fileInput) {
            fileInput.addEventListener('change', function(e) {
                const file = this.files[0];
                if (file && Validators.isPDF(file)) {
                    handleFile(file);
                } else {
                    showToast('error', 'Please upload a valid PDF');
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
                if (file && Validators.isPDF(file)) {
                    handleFile(file);
                }
            });
        }

        // Remove
        if (removeBtn) {
            removeBtn.addEventListener('click', removePages);
        }

        // Download
        if (downloadBtn) {
            downloadBtn.addEventListener('click', downloadRemoved);
        }
    }

    /**
     * Handle file upload
     */
    async function handleFile(file) {
        currentFile = file;
        
        try {
            totalPages = await PDFProcessor.getPDFPageCount(file);
            
            const infoDiv = document.getElementById('removeFileInfo');
            const details = document.getElementById('removeFileDetails');
            if (infoDiv && details) {
                infoDiv.style.display = 'block';
                details.textContent = `📄 ${file.name} (${totalPages} pages, ${FileHelpers.formatFileSize(file.size)})`;
            }

            document.getElementById('removePagesBtn').disabled = false;
            document.getElementById('removeResult').style.display = 'none';
            
            // Show page list with checkboxes
            renderPageList();
            
            showToast('success', `Loaded PDF with ${totalPages} pages`);

        } catch (error) {
            console.error('Error reading PDF:', error);
            showToast('error', `Failed to read PDF: ${error.message}`);
        }
    }

    /**
     * Render page list with checkboxes
     */
    function renderPageList() {
        const list = document.getElementById('pageList');
        if (!list) return;

        let html = '<h4>Select pages to remove:</h4><div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(80px,1fr));gap:8px;">';
        
        for (let i = 1; i <= totalPages; i++) {
            html += `
                <div style="display:flex;align-items:center;gap:4px;padding:4px 8px;background:#f5f5f5;border-radius:4px;">
                    <input type="checkbox" class="page-checkbox" data-page="${i}" id="page_${i}">
                    <label for="page_${i}" style="font-size:13px;cursor:pointer;">Page ${i}</label>
                </div>
            `;
        }
        
        html += '</div>';
        list.innerHTML = html;

        // Add select/deselect all
        const container = document.createElement('div');
        container.style.marginTop = '8px';
        container.innerHTML = `
            <button class="btn btn-secondary" id="selectAllPages" style="padding:4px 12px;font-size:12px;">Select All</button>
            <button class="btn btn-secondary" id="deselectAllPages" style="padding:4px 12px;font-size:12px;">Deselect All</button>
        `;
        list.appendChild(container);

        document.getElementById('selectAllPages').addEventListener('click', function() {
            document.querySelectorAll('.page-checkbox').forEach(cb => cb.checked = true);
        });

        document.getElementById('deselectAllPages').addEventListener('click', function() {
            document.querySelectorAll('.page-checkbox').forEach(cb => cb.checked = false);
        });
    }

    /**
     * Remove pages
     */
    async function removePages() {
        if (!currentFile) {
            showToast('warning', 'Please upload a PDF first');
            return;
        }

        const removeBtn = document.getElementById('removePagesBtn');
        removeBtn.disabled = true;
        removeBtn.textContent = '⏳ Processing...';

        try {
            // Get selected pages from checkboxes
            const checkboxes = document.querySelectorAll('.page-checkbox:checked');
            let pagesToRemove = Array.from(checkboxes).map(cb => parseInt(cb.dataset.page));
            
            // Or from text input
            const pagesInput = document.getElementById('removePages').value;
            if (pagesInput.trim()) {
                const result = Validators.validatePageRange(pagesInput, totalPages);
                if (result.valid) {
                    pagesToRemove = result.pages;
                } else {
                    throw new Error(result.error);
                }
            }

            if (pagesToRemove.length === 0) {
                showToast('warning', 'Please select pages to remove');
                removeBtn.disabled = false;
                removeBtn.textContent = '🗑️ Remove Pages';
                return;
            }

            // Reverse selection if checked
            const reverse = document.getElementById('reverseSelection').checked;
            if (reverse) {
                const allPages = Array.from({ length: totalPages }, (_, i) => i + 1);
                pagesToRemove = allPages.filter(p => !pagesToRemove.includes(p));
            }

            // Use SplitEngine to delete pages
            const { PDFDocument } = window.PDFLib;
            const arrayBuffer = await FileHelpers.readAsArrayBuffer(currentFile);
            const pdf = await PDFDocument.load(arrayBuffer);
            
            const keepPages = [];
            for (let i = 0; i < totalPages; i++) {
                if (!pagesToRemove.includes(i + 1)) {
                    keepPages.push(i);
                }
            }

            if (keepPages.length === 0) {
                throw new Error('Cannot remove all pages');
            }

            const newPdf = await PDFDocument.create();
            const pages = await newPdf.copyPages(pdf, keepPages);
            for (const page of pages) {
                newPdf.addPage(page);
            }

            const pdfBytes = await newPdf.save();
            const blob = new Blob([pdfBytes], { type: 'application/pdf' });
            const filename = `${FileHelpers.getFileNameWithoutExtension(currentFile.name)}_modified.pdf`;
            
            window._removedPdf = {
                blob,
                filename,
                removed: pagesToRemove.length,
                remaining: keepPages.length
            };

            // Show result
            const resultDiv = document.getElementById('removeResult');
            if (resultDiv) {
                resultDiv.style.display = 'block';
            }

            document.getElementById('removedInfo').textContent = 
                `Removed ${pagesToRemove.length} pages, ${keepPages.length} pages remaining`;

            showToast('success', `Removed ${pagesToRemove.length} pages`);

        } catch (error) {
            console.error('Remove pages error:', error);
            showToast('error', `Failed to remove pages: ${error.message}`);
        } finally {
            removeBtn.disabled = false;
            removeBtn.textContent = '🗑️ Remove Pages';
        }
    }

    /**
     * Download modified PDF
     */
    function downloadRemoved() {
        if (!window._removedPdf) {
            showToast('warning', 'Please remove pages first');
            return;
        }

        DownloadHelpers.downloadBlob(window._removedPdf.blob, window._removedPdf.filename);
        showToast('success', 'PDF downloaded');
    }

    // Public API
    return {
        render
    };

})();

// Make RemovePagesToolController globally available
window.RemovePagesToolController = RemovePagesToolController;