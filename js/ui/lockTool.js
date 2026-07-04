/**
 * Lock PDF - UI Controller
 */

const LockToolController = (function() {
    'use strict';

    let currentFile = null;

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
                        <h2>🔒 Lock PDF</h2>
                        <p>Password protect your PDF documents</p>
                    </div>

                    <div class="upload-area" id="lockUploadArea">
                        <input type="file" id="lockFileInput" accept=".pdf,application/pdf">
                        <div class="upload-icon">📤</div>
                        <div class="upload-text">Drop a PDF here or click to browse</div>
                    </div>

                    <div id="lockFileInfo" style="margin: 10px 0; display: none;">
                        <span id="lockFileDetails"></span>
                    </div>

                    <div class="settings-group" style="flex-direction: column; align-items: stretch;">
                        <label>
                            Password:
                            <input type="password" id="passwordInput" placeholder="Enter password" style="width: 300px; margin-top: 5px;">
                        </label>
                        <label>
                            Confirm Password:
                            <input type="password" id="confirmPasswordInput" placeholder="Confirm password" style="width: 300px; margin-top: 5px;">
                        </label>
                        <div style="margin-top: 10px;">
                            <label>
                                <input type="checkbox" id="showPassword"> Show password
                            </label>
                        </div>
                    </div>

                    <div class="settings-group">
                        <label>
                            Encryption Level:
                            <select id="encryptionLevel">
                                <option value="128">128-bit (Faster)</option>
                                <option value="256" selected>256-bit (Stronger)</option>
                            </select>
                        </label>
                    </div>

                    <button class="btn btn-primary" id="lockPdfBtn" disabled>
                        🔒 Lock PDF
                    </button>

                    <div class="progress-container">
                        <div class="progress-bar"></div>
                        <div class="progress-text"></div>
                    </div>

                    <div id="lockResult" style="display: none; margin-top: 20px;">
                        <div style="background: #e8f5e9; padding: 15px; border-radius: 8px; margin-bottom: 15px;">
                            ✅ PDF locked successfully!
                            <div style="font-size: 13px; margin-top: 5px; color: #666;">
                                Password: <strong id="displayPassword"></strong>
                            </div>
                        </div>
                        <button class="btn btn-success" id="downloadLockedBtn">📥 Download Locked PDF</button>
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
        const fileInput = document.getElementById('lockFileInput');
        const uploadArea = document.getElementById('lockUploadArea');
        const lockBtn = document.getElementById('lockPdfBtn');
        const downloadBtn = document.getElementById('downloadLockedBtn');
        const passwordInput = document.getElementById('passwordInput');
        const confirmInput = document.getElementById('confirmPasswordInput');
        const showPassword = document.getElementById('showPassword');

        // Show/hide password
        if (showPassword) {
            showPassword.addEventListener('change', function() {
                const type = this.checked ? 'text' : 'password';
                document.getElementById('passwordInput').type = type;
                document.getElementById('confirmPasswordInput').type = type;
            });
        }

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

        // Lock
        if (lockBtn) {
            lockBtn.addEventListener('click', lockPDF);
        }

        // Download
        if (downloadBtn) {
            downloadBtn.addEventListener('click', downloadLocked);
        }
    }

    /**
     * Handle file upload
     */
    function handleFile(file) {
        currentFile = file;
        
        const infoDiv = document.getElementById('lockFileInfo');
        const details = document.getElementById('lockFileDetails');
        if (infoDiv && details) {
            infoDiv.style.display = 'block';
            details.textContent = `📄 ${file.name} (${FileHelpers.formatFileSize(file.size)})`;
        }

        document.getElementById('lockPdfBtn').disabled = false;
        document.getElementById('lockResult').style.display = 'none';
        
        showToast('success', 'PDF loaded');
    }

    /**
     * Lock PDF with password
     */
    async function lockPDF() {
        if (!currentFile) {
            showToast('warning', 'Please upload a PDF first');
            return;
        }

        const password = document.getElementById('passwordInput').value;
        const confirm = document.getElementById('confirmPasswordInput').value;

        if (!password) {
            showToast('warning', 'Please enter a password');
            return;
        }

        if (password !== confirm) {
            showToast('error', 'Passwords do not match');
            return;
        }

        if (password.length < 4) {
            showToast('error', 'Password must be at least 4 characters');
            return;
        }

        const lockBtn = document.getElementById('lockPdfBtn');
        lockBtn.disabled = true;
        lockBtn.textContent = '⏳ Encrypting...';

        try {
            const { PDFDocument } = window.PDFLib;
            const arrayBuffer = await FileHelpers.readAsArrayBuffer(currentFile);
            const pdf = await PDFDocument.load(arrayBuffer);
            
            // Encrypt the PDF
            const encryptionLevel = parseInt(document.getElementById('encryptionLevel').value);
            await pdf.encrypt({
                userPassword: password,
                ownerPassword: password,
                permissions: {
                    printing: 'highResolution',
                    modifying: false,
                    copying: false,
                    annotating: false,
                    fillingForms: false,
                    contentExtraction: false,
                    documentAssembly: false,
                    printingLowQuality: false
                },
                encryptionAlgorithm: encryptionLevel === 256 ? 'aes256' : 'aes128'
            });

            const pdfBytes = await pdf.save();
            const blob = new Blob([pdfBytes], { type: 'application/pdf' });
            const filename = `${FileHelpers.getFileNameWithoutExtension(currentFile.name)}_locked.pdf`;
            
            window._lockedPdf = {
                blob,
                filename,
                password
            };

            // Show result
            const resultDiv = document.getElementById('lockResult');
            if (resultDiv) {
                resultDiv.style.display = 'block';
            }

            document.getElementById('displayPassword').textContent = password;

            showToast('success', 'PDF locked successfully!');

        } catch (error) {
            console.error('Lock error:', error);
            showToast('error', `Encryption failed: ${error.message}`);
        } finally {
            lockBtn.disabled = false;
            lockBtn.textContent = '🔒 Lock PDF';
        }
    }

    /**
     * Download locked PDF
     */
    function downloadLocked() {
        if (!window._lockedPdf) {
            showToast('warning', 'Please lock a PDF first');
            return;
        }

        DownloadHelpers.downloadBlob(window._lockedPdf.blob, window._lockedPdf.filename);
        showToast('success', 'Locked PDF downloaded');
    }

    // Public API
    return {
        render
    };

})();

// Make LockToolController globally available
window.LockToolController = LockToolController;