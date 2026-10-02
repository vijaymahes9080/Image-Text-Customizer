/**
 * Image Text Customizer - Text Editor & Property Manager
 */

class TextEditor {
  constructor(canvasEditor, historyManager) {
    this.canvasEditor = canvasEditor;
    this.history = historyManager;
    this.selectedObject = null;
    this.isUpdatingUI = false;

    this.initDOM();
    this.bindEvents();
  }

  initDOM() {
    this.dom = {
      propertyPanel: document.getElementById('textPropertyContent'),
      noSelectionNotice: document.getElementById('noSelectionNotice'),
      textContent: document.getElementById('propTextContent'),
      fontFamily: document.getElementById('propFontFamily'),
      fontSize: document.getElementById('propFontSize'),
      fontSizeVal: document.getElementById('propFontSizeVal'),
      fontColor: document.getElementById('propFontColor'),
      fontColorHex: document.getElementById('propFontColorHex'),
      fontWeight: document.getElementById('propFontWeight'),
      btnItalic: document.getElementById('propItalic'),
      btnCaseUpper: document.getElementById('propCaseUpper'),
      btnCaseLower: document.getElementById('propCaseLower'),
      alignButtons: document.querySelectorAll('.btn-align'),
      opacity: document.getElementById('propOpacity'),
      opacityVal: document.getElementById('propOpacityVal'),
      letterSpacing: document.getElementById('propLetterSpacing'),
      letterSpacingVal: document.getElementById('propLetterSpacingVal'),
      lineHeight: document.getElementById('propLineHeight'),
      lineHeightVal: document.getElementById('propLineHeightVal'),
      rotation: document.getElementById('propRotation'),
      rotationVal: document.getElementById('propRotationVal'),
      repairBackground: document.getElementById('propRepairBackground'),
      repairMethod: document.getElementById('propRepairMethod'),
      repairPadding: document.getElementById('propRepairPadding'),
      repairPaddingVal: document.getElementById('propRepairPaddingVal'),
      // Floating toolbar elements
      floatingToolbar: document.getElementById('floatingToolbar'),
      btnFloatingEdit: document.getElementById('floatingEditBtn'),
      btnFloatingDuplicate: document.getElementById('floatingDuplicateBtn'),
      btnFloatingDelete: document.getElementById('floatingDeleteBtn'),
      // Inline text editor modal/popover
      quickEditModal: document.getElementById('quickEditModal'),
      quickEditText: document.getElementById('quickEditText'),
      quickEditFontFamily: document.getElementById('quickEditFontFamily'),
      quickEditFontSize: document.getElementById('quickEditFontSize'),
      quickEditFontColor: document.getElementById('quickEditFontColor'),
      btnQuickModalClose: document.getElementById('btnQuickModalClose'),
      btnQuickApply: document.getElementById('btnQuickApply'),
      btnQuickCancel: document.getElementById('btnQuickCancel'),
      // Original Style Detected Elements
      originalStyleCard: document.getElementById('originalStyleCard'),
      styleMatchQuality: document.getElementById('styleMatchQuality'),
      styleDetectedFont: document.getElementById('styleDetectedFont'),
      styleDetectedSize: document.getElementById('styleDetectedSize'),
      styleDetectedWeight: document.getElementById('styleDetectedWeight'),
      styleColorSwatch: document.getElementById('styleColorSwatch'),
      styleColorHex: document.getElementById('styleColorHex'),
      styleDetectedAlign: document.getElementById('styleDetectedAlign'),
      styleDetectedAngle: document.getElementById('styleDetectedAngle'),
      propMatchOriginalStyle: document.getElementById('propMatchOriginalStyle'),
      btnResetToManual: document.getElementById('btnResetToManual')
    };
  }

  bindEvents() {
    // Text Content input
    this.dom.textContent.addEventListener('input', (e) => {
      if (!this.selectedObject || this.isUpdatingUI) return;
      this.selectedObject.text = e.target.value;
      this.canvasEditor.fitObjectToText(this.selectedObject);
      this.canvasEditor.render();
      this.canvasEditor.notifyObjectsChange();
      this.pushHistoryDebounced('Edit Text Content');
    });

    // Font Family
    this.dom.fontFamily.addEventListener('change', (e) => {
      if (!this.selectedObject || this.isUpdatingUI) return;
      this.selectedObject.fontFamily = e.target.value;
      this.canvasEditor.fitObjectToText(this.selectedObject);
      this.canvasEditor.render();
      this.saveHistory('Change Font Family');
    });

    // Font Size Slider
    this.dom.fontSize.addEventListener('input', (e) => {
      if (!this.selectedObject || this.isUpdatingUI) return;
      const size = parseInt(e.target.value, 10);
      this.selectedObject.fontSize = size;
      if (this.dom.fontSizeVal) this.dom.fontSizeVal.textContent = `${size}px`;
      this.canvasEditor.fitObjectToText(this.selectedObject);
      this.canvasEditor.render();
      this.pushHistoryDebounced('Change Font Size');
    });

    // Font Color Picker
    this.dom.fontColor.addEventListener('input', (e) => {
      if (!this.selectedObject || this.isUpdatingUI) return;
      this.selectedObject.fillColor = e.target.value;
      if (this.dom.fontColorHex) this.dom.fontColorHex.value = e.target.value.toUpperCase();
      this.canvasEditor.render();
      this.pushHistoryDebounced('Change Text Color');
    });

    // Font Color Hex Input
    if (this.dom.fontColorHex) {
      const applyHex = (hexVal) => {
        let hex = hexVal.trim();
        if (!hex.startsWith('#')) hex = '#' + hex;
        if (/^#[0-9A-Fa-f]{6}$/.test(hex)) {
          this.selectedObject.fillColor = hex;
          this.dom.fontColor.value = hex;
          this.canvasEditor.render();
          this.saveHistory('Change Text Color');
        }
      };
      this.dom.fontColorHex.addEventListener('input', (e) => {
        if (!this.selectedObject || this.isUpdatingUI) return;
        applyHex(e.target.value);
      });
      this.dom.fontColorHex.addEventListener('change', (e) => {
        if (!this.selectedObject || this.isUpdatingUI) return;
        applyHex(e.target.value);
      });
    }

    // Font Weight
    this.dom.fontWeight.addEventListener('change', (e) => {
      if (!this.selectedObject || this.isUpdatingUI) return;
      this.selectedObject.fontWeight = e.target.value;
      this.canvasEditor.render();
      this.saveHistory('Change Font Weight');
    });

    // Italic Toggle
    this.dom.btnItalic.addEventListener('click', () => {
      if (!this.selectedObject || this.isUpdatingUI) return;
      const isItalic = this.selectedObject.fontStyle === 'italic';
      this.selectedObject.fontStyle = isItalic ? 'normal' : 'italic';
      this.dom.btnItalic.classList.toggle('active', !isItalic);
      this.canvasEditor.render();
      this.saveHistory('Toggle Italic');
    });

    // Case conversions
    this.dom.btnCaseUpper.addEventListener('click', () => {
      if (!this.selectedObject) return;
      this.selectedObject.text = this.selectedObject.text.toUpperCase();
      this.dom.textContent.value = this.selectedObject.text;
      this.canvasEditor.fitObjectToText(this.selectedObject);
      this.canvasEditor.render();
      this.canvasEditor.notifyObjectsChange();
      this.saveHistory('Transform Uppercase');
    });

    this.dom.btnCaseLower.addEventListener('click', () => {
      if (!this.selectedObject) return;
      this.selectedObject.text = this.selectedObject.text.toLowerCase();
      this.dom.textContent.value = this.selectedObject.text;
      this.canvasEditor.fitObjectToText(this.selectedObject);
      this.canvasEditor.render();
      this.canvasEditor.notifyObjectsChange();
      this.saveHistory('Transform Lowercase');
    });

    // Align buttons
    this.dom.alignButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        if (!this.selectedObject) return;
        const align = btn.dataset.align;
        this.selectedObject.textAlign = align;
        this.dom.alignButtons.forEach(b => b.classList.toggle('active', b.dataset.align === align));
        this.canvasEditor.render();
        this.saveHistory('Change Alignment');
      });
    });

    // Opacity
    this.dom.opacity.addEventListener('input', (e) => {
      if (!this.selectedObject || this.isUpdatingUI) return;
      const val = parseFloat(e.target.value);
      this.selectedObject.opacity = val;
      if (this.dom.opacityVal) this.dom.opacityVal.textContent = `${Math.round(val * 100)}%`;
      this.canvasEditor.render();
      this.pushHistoryDebounced('Change Opacity');
    });

    // Letter Spacing
    this.dom.letterSpacing.addEventListener('input', (e) => {
      if (!this.selectedObject || this.isUpdatingUI) return;
      const val = parseFloat(e.target.value);
      this.selectedObject.letterSpacing = val;
      if (this.dom.letterSpacingVal) this.dom.letterSpacingVal.textContent = `${val}px`;
      this.canvasEditor.render();
      this.pushHistoryDebounced('Change Letter Spacing');
    });

    // Line Height
    this.dom.lineHeight.addEventListener('input', (e) => {
      if (!this.selectedObject || this.isUpdatingUI) return;
      const val = parseFloat(e.target.value);
      this.selectedObject.lineHeight = val;
      if (this.dom.lineHeightVal) this.dom.lineHeightVal.textContent = val.toFixed(1);
      this.canvasEditor.render();
      this.pushHistoryDebounced('Change Line Height');
    });

    // Rotation
    this.dom.rotation.addEventListener('input', (e) => {
      if (!this.selectedObject || this.isUpdatingUI) return;
      const val = parseInt(e.target.value, 10);
      this.selectedObject.rotation = val;
      if (this.dom.rotationVal) this.dom.rotationVal.textContent = `${val}°`;
      this.canvasEditor.render();
      this.pushHistoryDebounced('Change Rotation');
    });

    // Background Repair Toggle
    this.dom.repairBackground.addEventListener('change', (e) => {
      if (!this.selectedObject || this.isUpdatingUI) return;
      this.selectedObject.repairBackground = e.target.checked;
      this.canvasEditor.invalidateBackground();
      this.canvasEditor.render();
      this.saveHistory('Toggle Background Repair');
    });

    // Background Repair Method
    this.dom.repairMethod.addEventListener('change', (e) => {
      if (!this.selectedObject || this.isUpdatingUI) return;
      this.selectedObject.repairMethod = e.target.value;
      this.canvasEditor.invalidateBackground();
      this.canvasEditor.render();
      this.saveHistory('Change Repair Method');
    });

    // Background Repair Padding
    this.dom.repairPadding.addEventListener('input', (e) => {
      if (!this.selectedObject || this.isUpdatingUI) return;
      const val = parseInt(e.target.value, 10);
      this.selectedObject.repairPadding = val;
      if (this.dom.repairPaddingVal) this.dom.repairPaddingVal.textContent = `${val}px`;
      this.canvasEditor.invalidateBackground();
      this.canvasEditor.render();
      this.pushHistoryDebounced('Change Repair Padding');
    });

    // Floating Toolbar buttons
    this.dom.btnFloatingEdit.addEventListener('click', () => this.openQuickEdit());
    this.dom.btnFloatingDuplicate.addEventListener('click', () => {
      if (this.selectedObject) {
        this.canvasEditor.duplicateObject(this.selectedObject);
      }
    });
    this.dom.btnFloatingDelete.addEventListener('click', () => {
      if (this.selectedObject) {
        this.canvasEditor.deleteObject(this.selectedObject.id);
      }
    });

    // Quick Edit Keyboard shortcuts & backdrop click
    this.dom.quickEditText.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && (!e.shiftKey || e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        this.dom.btnQuickApply.click();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        this.closeQuickEdit();
      }
    });

    this.dom.quickEditModal.addEventListener('click', (e) => {
      if (e.target === this.dom.quickEditModal) {
        this.closeQuickEdit();
      }
    });

    if (this.dom.btnQuickModalClose) {
      this.dom.btnQuickModalClose.addEventListener('click', () => this.closeQuickEdit());
    }

    // Quick Edit Apply
    this.dom.btnQuickApply.addEventListener('click', () => {
      if (this.selectedObject) {
        this.selectedObject.text = this.dom.quickEditText.value;
        if (this.dom.quickEditFontFamily) {
          this.selectedObject.fontFamily = this.dom.quickEditFontFamily.value;
        }
        if (this.dom.quickEditFontSize) {
          const sz = parseInt(this.dom.quickEditFontSize.value, 10);
          if (sz > 0) this.selectedObject.fontSize = sz;
        }
        if (this.dom.quickEditFontColor) {
          this.selectedObject.fillColor = this.dom.quickEditFontColor.value;
        }

        this.canvasEditor.fitObjectToText(this.selectedObject);
        this.canvasEditor.invalidateBackground();
        this.canvasEditor.render();
        this.canvasEditor.notifyObjectsChange();
        this.select(this.selectedObject);
        this.saveHistory('Quick Edit Text');
        this.closeQuickEdit();
        ITCUtils.showToast('Text updated with original style preserved!', 'success', 1200);
      }
    });

    this.dom.btnQuickCancel.addEventListener('click', () => this.closeQuickEdit());

    // Match Original Style Toggle
    if (this.dom.propMatchOriginalStyle) {
      this.dom.propMatchOriginalStyle.addEventListener('change', (e) => {
        if (!this.selectedObject || this.isUpdatingUI) return;
        this.selectedObject.matchOriginalStyle = e.target.checked;
        if (this.selectedObject.matchOriginalStyle && this.selectedObject.originalStyleProfile) {
          const p = this.selectedObject.originalStyleProfile;
          this.selectedObject.fontFamily = p.fontFamily;
          this.selectedObject.fontWeight = p.fontWeight;
          this.selectedObject.fontStyle = p.fontStyle;
          this.selectedObject.fillColor = p.fillColor;
          this.selectedObject.opacity = p.opacity;
          this.selectedObject.letterSpacing = p.letterSpacing;
          this.selectedObject.lineHeight = p.lineHeight;
          this.selectedObject.textAlign = p.textAlign;
          this.selectedObject.rotation = p.rotation;
          this.selectedObject.stroke = p.stroke;
          this.selectedObject.shadow = p.shadow;
          this.canvasEditor.fitObjectToText(this.selectedObject);
          this.select(this.selectedObject);
          this.canvasEditor.render();
          this.saveHistory('Match Original Style');
          ITCUtils.showToast('Original style profile re-applied', 'success', 1500);
        }
      });
    }

    // Reset to Manual
    if (this.dom.btnResetToManual) {
      this.dom.btnResetToManual.addEventListener('click', () => {
        if (!this.selectedObject) return;
        this.selectedObject.matchOriginalStyle = false;
        if (this.dom.propMatchOriginalStyle) {
          this.dom.propMatchOriginalStyle.checked = false;
        }
        ITCUtils.showToast('Switched to manual customization mode', 'info', 1500);
      });
    }

    this.pushHistoryDebounced = ITCUtils.debounce((action) => {
      this.saveHistory(action);
    }, 450);
  }

  saveHistory(action) {
    if (this.canvasEditor) {
      this.canvasEditor.saveHistoryState(action);
    }
  }

  /**
   * Select a text object and bind all its properties to the UI.
   */
  select(textObj) {
    this.selectedObject = textObj;

    if (!textObj) {
      this.dom.propertyPanel.style.display = 'none';
      this.dom.noSelectionNotice.style.display = 'flex';
      this.dom.floatingToolbar.style.display = 'none';
      return;
    }

    // Automatically switch right panel to "Text" tab if not currently active
    const textTabBtn = document.querySelector('.panel-tab-btn[data-tab="text"]');
    const textTabPanel = document.getElementById('tab-text');
    if (textTabBtn && textTabPanel && !textTabBtn.classList.contains('active')) {
      document.querySelectorAll('.panel-tab-btn').forEach(b => b.classList.toggle('active', b === textTabBtn));
      document.querySelectorAll('.panel-tab-content').forEach(p => p.classList.toggle('active', p === textTabPanel));
    }

    this.isUpdatingUI = true;
    this.dom.propertyPanel.style.display = 'block';
    this.dom.noSelectionNotice.style.display = 'none';

    // Populate values
    this.dom.textContent.value = textObj.text || '';
    this.dom.fontFamily.value = textObj.fontFamily || 'Arial';
    this.dom.fontSize.value = textObj.fontSize || 32;
    if (this.dom.fontSizeVal) this.dom.fontSizeVal.textContent = `${textObj.fontSize || 32}px`;

    this.dom.fontColor.value = textObj.fillColor || '#000000';
    if (this.dom.fontColorHex) this.dom.fontColorHex.value = (textObj.fillColor || '#000000').toUpperCase();

    this.dom.fontWeight.value = textObj.fontWeight || 'normal';
    this.dom.btnItalic.classList.toggle('active', textObj.fontStyle === 'italic');

    this.dom.alignButtons.forEach(btn => {
      btn.classList.toggle('active', btn.dataset.align === (textObj.textAlign || 'left'));
    });

    const op = textObj.opacity !== undefined ? textObj.opacity : 1;
    this.dom.opacity.value = op;
    if (this.dom.opacityVal) this.dom.opacityVal.textContent = `${Math.round(op * 100)}%`;

    const ls = textObj.letterSpacing || 0;
    this.dom.letterSpacing.value = ls;
    if (this.dom.letterSpacingVal) this.dom.letterSpacingVal.textContent = `${ls}px`;

    const lh = textObj.lineHeight || 1.2;
    this.dom.lineHeight.value = lh;
    if (this.dom.lineHeightVal) this.dom.lineHeightVal.textContent = lh.toFixed(1);

    const rot = textObj.rotation || 0;
    this.dom.rotation.value = rot;
    if (this.dom.rotationVal) this.dom.rotationVal.textContent = `${rot}°`;

    this.dom.repairBackground.checked = !!textObj.repairBackground;
    this.dom.repairMethod.value = textObj.repairMethod || 'auto';
    const pad = textObj.repairPadding !== undefined ? textObj.repairPadding : 4;
    this.dom.repairPadding.value = pad;
    if (this.dom.repairPaddingVal) this.dom.repairPaddingVal.textContent = `${pad}px`;

    // Populate Original Style Detected Card if available
    if (textObj.originalStyleProfile && this.dom.originalStyleCard) {
      const p = textObj.originalStyleProfile;
      this.dom.originalStyleCard.style.display = 'block';
      if (this.dom.styleMatchQuality) {
        this.dom.styleMatchQuality.textContent = `Match: ${p.matchQuality || 'High'} (${p.matchScore || 92}%)`;
      }
      if (this.dom.styleDetectedFont) {
        this.dom.styleDetectedFont.textContent = `${p.fontFamily} (${p.matchType || 'Estimated'})`;
        this.dom.styleDetectedFont.title = `${p.fontFamily} (${p.matchType || 'Estimated'})`;
      }
      if (this.dom.styleDetectedSize) {
        this.dom.styleDetectedSize.textContent = `${p.fontSize}px`;
      }
      if (this.dom.styleDetectedWeight) {
        this.dom.styleDetectedWeight.textContent = `${p.fontWeight}`;
      }
      if (this.dom.styleColorSwatch) {
        this.dom.styleColorSwatch.style.backgroundColor = p.fillColor || '#ffffff';
      }
      if (this.dom.styleColorHex) {
        this.dom.styleColorHex.textContent = p.fillColor || '#ffffff';
      }
      if (this.dom.styleDetectedAlign) {
        this.dom.styleDetectedAlign.textContent = p.textAlign || 'center';
      }
      if (this.dom.styleDetectedAngle) {
        this.dom.styleDetectedAngle.textContent = `${p.rotation || 0}°`;
      }
      if (this.dom.propMatchOriginalStyle) {
        this.dom.propMatchOriginalStyle.checked = !!textObj.matchOriginalStyle;
      }
    } else if (this.dom.originalStyleCard) {
      this.dom.originalStyleCard.style.display = 'none';
    }

    this.isUpdatingUI = false;
  }

  updateFloatingToolbarPosition(screenPos) {
    if (!this.selectedObject || !screenPos) {
      this.dom.floatingToolbar.style.display = 'none';
      return;
    }

    this.dom.floatingToolbar.style.display = 'flex';
    this.dom.floatingToolbar.style.left = `${screenPos.x}px`;
    this.dom.floatingToolbar.style.top = `${screenPos.y - 48}px`;
  }

  openQuickEdit() {
    if (!this.selectedObject) return;
    this.dom.quickEditText.value = this.selectedObject.text || '';
    if (this.dom.quickEditFontFamily) {
      this.dom.quickEditFontFamily.value = this.selectedObject.fontFamily || 'Inter';
    }
    if (this.dom.quickEditFontSize) {
      this.dom.quickEditFontSize.value = this.selectedObject.fontSize || 32;
    }
    if (this.dom.quickEditFontColor) {
      this.dom.quickEditFontColor.value = this.selectedObject.fillColor || '#ffffff';
    }

    this.dom.quickEditModal.classList.add('active');
    setTimeout(() => {
      this.dom.quickEditText.focus();
      this.dom.quickEditText.select();
    }, 50);
  }

  closeQuickEdit() {
    this.dom.quickEditModal.classList.remove('active');
  }
}

window.TextEditor = TextEditor;
