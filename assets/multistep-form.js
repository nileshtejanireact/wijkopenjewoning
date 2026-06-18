class MultistepForm {
  constructor() {
    this.currentStep = 1;
    this.totalSteps = 6;
    this.formData = {};
    this.submissionURL = 'https://www.greatwebdev.com/wijkopenjewoning.php';
    
    this.form = document.getElementById('bidForm');
    this.nextBtn = document.getElementById('nextBtn');
    this.prevBtn = document.getElementById('prevBtn');
    this.submitBtn = document.getElementById('submitBtn');
    this.formLoading = document.getElementById('formLoading');
    this.formSuccess = document.getElementById('formSuccess');
    this.progressFill = document.getElementById('progressFill');
    this.confirmationSummary = document.getElementById('confirmationSummary');
    
    if (this.form) {
      this.init();
    }
  }

  init() {
    this.nextBtn.addEventListener('click', (e) => this.handleNext(e));
    this.prevBtn.addEventListener('click', (e) => this.handlePrev(e));
    this.form.addEventListener('submit', (e) => this.handleSubmit(e));
    
    // Auto-format postcode
    const postcodeInput = document.getElementById('postcode');
    if (postcodeInput) {
      postcodeInput.addEventListener('input', (e) => this.formatPostcode(e));
    }

    // Auto-format phone number
    const phoneInput = document.getElementById('phone');
    if (phoneInput) {
      phoneInput.addEventListener('input', (e) => this.formatPhone(e));
    }
    
    this.updateFormDisplay();
  }

  formatPostcode(e) {
    let value = e.target.value.toUpperCase().replace(/\s/g, '');
    if (value.length > 0) {
      if (value.length <= 4) {
        value = value;
      } else {
        value = value.slice(0, 4) + ' ' + value.slice(4, 6);
      }
    }
    e.target.value = value;
  }

  formatPhone(e) {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length >= 10) {
      value = value.slice(0, 10);
      value = value.replace(/(\d{2})(\d{4})(\d{4})/, '$1 $2 $3');
    }
    e.target.value = value;
  }

  validateField(field) {
    const rules = field.getAttribute('data-validate');
    if (!rules) return true;

    const validators = rules.split('|');
    const value = field.value.trim();
    const errorElement = field.parentElement.querySelector('.error-message');

    for (let validator of validators) {
      let isValid = false;
      let errorMsg = '';

      switch (validator) {
        case 'required':
          isValid = value.length > 0;
          errorMsg = 'Dit veld is verplicht';
          break;

        case 'email':
          isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
          errorMsg = 'Voer een geldig e-mailadres in';
          break;

        case 'postcode':
          isValid = /^[0-9]{4}\s?[A-Z]{2}$/.test(value);
          errorMsg = 'Voer een geldige postcode in (bijv. 1234 AB)';
          break;

        case 'phone':
          isValid = /^(\+31|0)[0-9\s()]{8,}$/.test(value.replace(/\s/g, ''));
          errorMsg = 'Voer een geldig telefoonnummer in';
          break;

        case 'number':
          isValid = !isNaN(value) && value.length > 0;
          errorMsg = 'Voer een geldig getal in';
          break;

        case 'year':
          const year = parseInt(value);
          isValid = year >= 1800 && year <= new Date().getFullYear();
          errorMsg = 'Voer een geldig jaar in';
          break;
      }

      if (!isValid) {
        field.classList.add('error');
        if (errorElement) {
          errorElement.textContent = errorMsg;
        }
        return false;
      }
    }

    field.classList.remove('error');
    if (errorElement) {
      errorElement.textContent = '';
    }
    return true;
  }

  validateStep(stepNum) {
    const stepElement = document.querySelector(`[data-step="${stepNum}"]`);
    const fields = stepElement.querySelectorAll('[data-validate]');
    const checkboxes = stepElement.querySelectorAll('input[type="checkbox"][data-validate]');
    
    let isValid = true;

    fields.forEach(field => {
      if (!this.validateField(field)) {
        isValid = false;
      }
    });

    checkboxes.forEach(checkbox => {
      const errorElement = checkbox.closest('label').parentElement.querySelector('.error-message');
      if (checkbox.hasAttribute('data-validate') && !checkbox.checked) {
        isValid = false;
        if (errorElement) {
          errorElement.textContent = 'Dit veld is verplicht';
        }
      } else if (errorElement && checkbox.checked) {
        errorElement.textContent = '';
      }
    });

    return isValid;
  }

  collectFormData() {
    const formElements = this.form.elements;
    
    for (let element of formElements) {
      if (element.name && element.value) {
        if (element.type === 'checkbox') {
          if (element.checked) {
            if (!this.formData[element.name]) {
              this.formData[element.name] = [];
            }
            this.formData[element.name].push(element.value);
          }
        } else {
          this.formData[element.name] = element.value;
        }
      }
    }
  }

  generateConfirmationSummary() {
    const sections = [
      {
        title: 'Adresgegevens',
        items: [
          { label: 'Postcode', value: this.formData.postcode },
          { label: 'Huisnummer', value: `${this.formData.housenumber}${this.formData.housenumber_suffix ? ' ' + this.formData.housenumber_suffix : ''}` }
        ]
      },
      {
        title: 'Eigenaarinformatie',
        items: [
          { label: 'Naam', value: `${this.formData.firstname} ${this.formData.lastname}` },
          { label: 'Burgerlijke staat', value: this.formatSelectOption(this.formData.marital_status) },
          { label: 'Medeëigenaar', value: this.formData.coowner === 'yes' ? 'Ja' : 'Nee' }
        ]
      },
      {
        title: 'Woninginformatie',
        items: [
          { label: 'Type woning', value: this.formatSelectOption(this.formData.property_type) },
          { label: 'Bouwjaar', value: this.formData.construction_year },
          { label: 'Aantal kamers', value: this.formData.rooms },
          { label: 'Woonoppervlak', value: `${this.formData.living_area} m²` },
          { label: 'Perceeloppervlak', value: `${this.formData.plot_area} m²` },
          { label: 'Staat onderhoud', value: this.formatSelectOption(this.formData.condition) }
        ]
      },
      {
        title: 'Contactgegevens',
        items: [
          { label: 'E-mail', value: this.formData.email },
          { label: 'Telefoon', value: this.formData.phone },
          { label: 'Voorkeur contactmoment', value: this.formatSelectOption(this.formData.contact_method) }
        ]
      },
      {
        title: 'Voorkeuren',
        items: [
          { label: 'Urgentie', value: this.formatSelectOption(this.formData.urgency) },
          { label: 'Geschatte prijs', value: `€ ${parseInt(this.formData.estimate_price).toLocaleString('nl-NL')}` },
          { label: 'Aanvullende diensten', value: Array.isArray(this.formData.additional_services) ? this.formData.additional_services.join(', ') || 'Geen' : 'Geen' }
        ]
      }
    ];

    let html = '';
    sections.forEach(section => {
      html += `<div class="summary-section"><h3>${section.title}</h3>`;
      section.items.forEach(item => {
        if (item.value) {
          html += `<div class="summary-item"><strong>${item.label}:</strong> <span>${item.value}</span></div>`;
        }
      });
      html += '</div>';
    });

    this.confirmationSummary.innerHTML = html;
  }

  formatSelectOption(value) {
    const optionMap = {
      'single': 'Ongehuwd',
      'married': 'Gehuwd',
      'partnership': 'Geregistreerd partnerschap',
      'divorced': 'Gescheiden',
      'widowed': 'Weduwe/Weduwnaar',
      'apartment': 'Appartement',
      'terraced': 'Rijtjeshuis',
      'semi_detached': 'Halfvrijstaande woning',
      'detached': 'Vrijstaande woning',
      'other': 'Overig',
      'excellent': 'Uitstekend',
      'good': 'Goed',
      'reasonable': 'Redelijk',
      'poor': 'Slecht',
      'morning': 'Ochtend (8:00 - 12:00)',
      'afternoon': 'Middag (12:00 - 17:00)',
      'evening': 'Avond (17:00 - 20:00)',
      'flexible': 'Flexibel',
      'asap': 'Zo snel mogelijk',
      '3months': 'Binnen 3 maanden',
      '6months': 'Binnen 6 maanden',
      'realtor': 'Makelaarsdiensten',
      'staging': 'Home staging',
      'inspection': 'Woning inspectie'
    };
    return optionMap[value] || value;
  }

  handleNext(e) {
    e.preventDefault();

    if (!this.validateStep(this.currentStep)) {
      return;
    }

    if (this.currentStep < this.totalSteps) {
      this.currentStep++;
      this.updateFormDisplay();
    }
  }

  handlePrev(e) {
    e.preventDefault();

    if (this.currentStep > 1) {
      this.currentStep--;
      this.updateFormDisplay();
    }
  }

  updateFormDisplay() {
    // Hide all steps
    document.querySelectorAll('.form-step').forEach(step => {
      step.classList.remove('active');
    });

    // Show current step
    document.querySelector(`[data-step="${this.currentStep}"]`).classList.add('active');

    // Update progress indicators
    document.querySelectorAll('.progress-step').forEach((step, index) => {
      const stepNum = index + 1;
      step.classList.remove('active', 'completed');
      
      if (stepNum === this.currentStep) {
        step.classList.add('active');
      } else if (stepNum < this.currentStep) {
        step.classList.add('completed');
      }
    });

    // Update progress bar
    const progressPercent = (this.currentStep / this.totalSteps) * 100;
    this.progressFill.style.width = progressPercent + '%';

    // Update button visibility
    this.prevBtn.classList.toggle('btn-hidden', this.currentStep === 1);
    this.nextBtn.classList.toggle('btn-hidden', this.currentStep === this.totalSteps);
    this.submitBtn.classList.toggle('btn-hidden', this.currentStep !== this.totalSteps);

    // Generate confirmation on final step
    if (this.currentStep === this.totalSteps) {
      this.collectFormData();
      this.generateConfirmationSummary();
    }

    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async handleSubmit(e) {
    e.preventDefault();

    if (!this.validateStep(this.totalSteps)) {
      return;
    }

    this.collectFormData();

    // Show loading state
    this.form.style.display = 'none';
    this.formLoading.style.display = 'block';

    try {
      // Prepare form data
      const formDataObj = new FormData();
      
      // Add all form fields
      for (const [key, value] of Object.entries(this.formData)) {
        if (Array.isArray(value)) {
          value.forEach((v, index) => {
            formDataObj.append(`${key}[${index}]`, v);
          });
        } else {
          formDataObj.append(key, value);
        }
      }

      // Add timestamp
      formDataObj.append('submitted_at', new Date().toISOString());

      // Send POST request
      const response = await fetch(this.submissionURL, {
        method: 'POST',
        body: formDataObj
      });

      if (response.ok) {
        // Show success message
        this.formLoading.style.display = 'none';
        this.formSuccess.style.display = 'block';
        
        // Reset form after 2 seconds
        setTimeout(() => {
          this.resetForm();
        }, 5000);
      } else {
        throw new Error('Form submission failed');
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      
      // Show error message
      this.formLoading.style.display = 'none';
      this.form.style.display = 'block';
      
      alert('Er is een fout opgetreden bij het indienen van het formulier. Probeer het later opnieuw.');
    }
  }

  resetForm() {
    this.form.reset();
    this.currentStep = 1;
    this.formData = {};
    this.formSuccess.style.display = 'none';
    this.form.style.display = 'block';
    this.updateFormDisplay();
  }
}

// Initialize form when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    new MultistepForm();
  });
} else {
  new MultistepForm();
}
