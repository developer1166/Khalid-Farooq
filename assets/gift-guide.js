(() => {

  'use strict';



  function initGiftGuideGrid(section) {

    if (!section) return;



    if (section.dataset.giftInitialized === 'true') {

      return;

    }



    section.dataset.giftInitialized = 'true';





    /* =====================================================

       ELEMENTS

    ===================================================== */



    const modal = section.querySelector('[data-gift-modal]');

    const dialog = section.querySelector('.gift-guide-modal__dialog');



    const image = section.querySelector('[data-gift-product-image]');

    const title = section.querySelector('[data-gift-product-title]');

    const price = section.querySelector('[data-gift-product-price]');

    const description = section.querySelector(

      '[data-gift-product-description]'

    );



    const colorGroup = section.querySelector(

      '[data-gift-color-group]'

    );



    const colorsContainer = section.querySelector(

      '[data-gift-colors]'

    );



    const sizeGroup = section.querySelector(

      '[data-gift-size-group]'

    );



    const sizeDropdown = section.querySelector(

      '[data-gift-size-dropdown]'

    );



    const sizeTrigger = section.querySelector(

      '[data-gift-size-trigger]'

    );



    const sizeText = section.querySelector(

      '[data-gift-size-text]'

    );



    const sizeMenu = section.querySelector(

      '[data-gift-size-menu]'

    );



    const addButton = section.querySelector(

      '[data-gift-add]'

    );



    const addLabel = section.querySelector(

      '[data-gift-add-label]'

    );



    const message = section.querySelector(

      '[data-gift-message]'

    );





    /* =====================================================

       REQUIRED ELEMENT CHECK

    ===================================================== */



    if (

      !modal ||

      !dialog ||

      !image ||

      !title ||

      !price ||

      !description ||

      !colorGroup ||

      !colorsContainer ||

      !sizeGroup ||

      !sizeDropdown ||

      !sizeTrigger ||

      !sizeText ||

      !sizeMenu ||

      !addButton ||

      !addLabel ||

      !message

    ) {

      console.warn(

        'Gift Guide: required popup elements were not found.'

      );



      return;

    }





    /* =====================================================

       STATE

    ===================================================== */



    let currentProduct = null;

    let currentVariant = null;



    let previousFocus = null;



    let selectedColor = '';

    let selectedSize = '';



    let colorOptionIndex = -1;

    let sizeOptionIndex = -1;



    let otherOptionIndexes = [];





    /* =====================================================

       MONEY

    ===================================================== */



    const currencyFormat =

      window.Shopify &&

      window.Shopify.money_format

        ? window.Shopify.money_format

        : '${{amount}}';





    function formatMoney(cents) {

      const amount = (

        Number(cents || 0) / 100

      ).toFixed(2);



      const parts = amount.split('.');



      parts[0] = parts[0].replace(

        /\B(?=(\d{3})+(?!\d))/g,

        ','

      );



      const formatted = parts.join('.');



      return currencyFormat

        .replace(

          /\{\{\s*amount\s*\}\}/g,

          formatted

        )

        .replace(

          /\{\{\s*amount_no_decimals\s*\}\}/g,

          parts[0]

        )

        .replace(

          /\{\{\s*amount_with_comma_separator\s*\}\}/g,

          formatted.replace('.', ',')

        )

        .replace(

          /\{\{\s*amount_no_decimals_with_comma_separator\s*\}\}/g,

          parts[0]

        );

    }





    /* =====================================================

       PRODUCT IMAGE

    ===================================================== */



    function getImageUrl(product) {

      if (!product) {

        return '';

      }



      if (product.featured_image) {

        if (

          typeof product.featured_image === 'string'

        ) {

          return product.featured_image;

        }



        if (product.featured_image.src) {

          return product.featured_image.src;

        }

      }



      if (

        Array.isArray(product.images) &&

        product.images.length

      ) {

        const firstImage = product.images[0];



        if (typeof firstImage === 'string') {

          return firstImage;

        }



        return firstImage.src || '';

      }



      return '';

    }





    /* =====================================================

       OPTION HELPERS

    ===================================================== */



    function getOptionNames(product) {

      return (product.options || []).map(

        (option, index) => {

          if (typeof option === 'string') {

            return option;

          }



          return (

            option.name ||

            `Option ${index + 1}`

          );

        }

      );

    }





    function getOptionIndex(

      names,

      expression

    ) {

      return names.findIndex((name) =>

        expression.test(name)

      );

    }





    function getVariantOption(

      variant,

      index

    ) {

      if (!variant || index < 0) {

        return '';

      }



      if (Array.isArray(variant.options)) {

        return variant.options[index] || '';

      }



      const key = `option${index + 1}`;



      return variant[key] || '';

    }





    /* =====================================================

       AVAILABLE VALUES

    ===================================================== */



    function getAvailableValues(optionIndex) {

      if (

        !currentProduct ||

        !Array.isArray(currentProduct.variants)

      ) {

        return [];

      }



      const values = [];



      currentProduct.variants.forEach(

        (variant) => {

          const value = getVariantOption(

            variant,

            optionIndex

          );



          if (

            value &&

            !values.includes(value)

          ) {

            values.push(value);

          }

        }

      );



      return values;

    }





    /* =====================================================

       COLOR VALUE

    ===================================================== */



    function getColorValue(color) {

      const normalized = String(color)

        .trim()

        .toLowerCase();



      const colorMap = {

        white: '#ffffff',

        black: '#000000',

        blue: '#244e9b',

        navy: '#17264a',

        red: '#d92727',

        green: '#26834a',

        yellow: '#fff033',

        grey: '#888888',

        gray: '#888888',

        beige: '#d8c6a5',

        brown: '#754c24',

        pink: '#f3a6bc',

        purple: '#7543a5',

        orange: '#ed8a26'

      };



      return (

        colorMap[normalized] ||

        '#f8f8f8'

      );

    }





    /* =====================================================

       COLOR AVAILABILITY

    ===================================================== */



    function isColorAvailable(color) {

      if (

        !currentProduct ||

        !Array.isArray(currentProduct.variants)

      ) {

        return false;

      }



      return currentProduct.variants.some(

        (variant) => {

          if (!variant.available) {

            return false;

          }



          if (

            getVariantOption(

              variant,

              colorOptionIndex

            ) !== color

          ) {

            return false;

          }



          if (

            selectedSize &&

            sizeOptionIndex >= 0 &&

            getVariantOption(

              variant,

              sizeOptionIndex

            ) !== selectedSize

          ) {

            return false;

          }



          return true;

        }

      );

    }





    /* =====================================================

       SIZE AVAILABILITY

    ===================================================== */



    function isSizeAvailable(size) {

      if (

        !currentProduct ||

        !Array.isArray(currentProduct.variants)

      ) {

        return false;

      }



      return currentProduct.variants.some(

        (variant) => {

          if (!variant.available) {

            return false;

          }



          if (

            getVariantOption(

              variant,

              sizeOptionIndex

            ) !== size

          ) {

            return false;

          }



          if (

            selectedColor &&

            colorOptionIndex >= 0 &&

            getVariantOption(

              variant,

              colorOptionIndex

            ) !== selectedColor

          ) {

            return false;

          }



          return true;

        }

      );

    }





    /* =====================================================

       SELECTED VARIANT

    ===================================================== */



    function getSelectedVariant() {

      if (

        !currentProduct ||

        !Array.isArray(currentProduct.variants)

      ) {

        return null;

      }



      return (

        currentProduct.variants.find(

          (variant) => {

            if (!variant.available) {

              return false;

            }





            /* COLOR */



            if (

              colorOptionIndex >= 0

            ) {

              if (!selectedColor) {

                return false;

              }



              if (

                getVariantOption(

                  variant,

                  colorOptionIndex

                ) !== selectedColor

              ) {

                return false;

              }

            }





            /* SIZE */



            if (

              sizeOptionIndex >= 0

            ) {

              if (!selectedSize) {

                return false;

              }



              if (

                getVariantOption(

                  variant,

                  sizeOptionIndex

                ) !== selectedSize

              ) {

                return false;

              }

            }





            /* OTHER OPTIONS */



            return otherOptionIndexes.every(

              (index) => {

                const availableDefault =

                  currentProduct.variants.find(

                    (item) =>

                      item.available

                  ) ||

                  currentProduct.variants[0];



                return (

                  getVariantOption(

                    variant,

                    index

                  ) ===

                  getVariantOption(

                    availableDefault,

                    index

                  )

                );

              }

            );

          }

        ) || null

      );

    }





    /* =====================================================

       MESSAGE

    ===================================================== */



    function updateMessage(

      text,

      isError = false

    ) {

      message.textContent = text || '';



      message.classList.toggle(

        'is-error',

        Boolean(isError)

      );

    }





    /* =====================================================

       RENDER COLORS

    ===================================================== */



    function renderColorOptions() {

      colorsContainer.replaceChildren();



      if (colorOptionIndex < 0) {

        colorGroup.hidden = true;

        return;

      }



      colorGroup.hidden = false;



      const colors =

        getAvailableValues(

          colorOptionIndex

        );





      colors.forEach((color) => {

        const button =

          document.createElement('button');



        button.type = 'button';



        button.className =

          'gift-guide-modal__color';



        button.dataset.color = color;



        button.setAttribute(

          'aria-label',

          `Choose ${color}`

        );





        /*

         \* IMPORTANT:

         \* no color selected when popup opens.

         */



        const isSelected =

          Boolean(selectedColor) &&

          color === selectedColor;



        button.setAttribute(

          'aria-pressed',

          String(isSelected)

        );



        if (isSelected) {

          button.classList.add(

            'is-selected'

          );

        }





        const indicator =

          document.createElement('span');



        indicator.className =

          'gift-guide-modal__color-indicator';



        indicator.setAttribute(

          'aria-hidden',

          'true'

        );



        indicator.style.backgroundColor =

          getColorValue(color);





        const text =

          document.createElement('span');



        text.className =

          'gift-guide-modal__color-text';



        text.textContent = color;





        button.appendChild(indicator);

        button.appendChild(text);





        const available =

          isColorAvailable(color);



        button.disabled = !available;





        button.addEventListener(

          'click',

          () => {

            if (!available) {

              return;

            }



            selectedColor = color;





            if (

              selectedSize &&

              !isSizeAvailable(

                selectedSize

              )

            ) {

              selectedSize = '';

            }





            refreshOptions();

          }

        );





        colorsContainer.appendChild(

          button

        );

      });

    }





    /* =====================================================

       CUSTOM SIZE DROPDOWN

    ===================================================== */



    function closeSizeMenu() {

      sizeDropdown.classList.remove(

        'is-open'

      );



      sizeTrigger.setAttribute(

        'aria-expanded',

        'false'

      );



      sizeMenu.hidden = true;

    }





    function openSizeMenu() {

      if (sizeGroup.hidden) {

        return;

      }



      sizeDropdown.classList.add(

        'is-open'

      );



      sizeTrigger.setAttribute(

        'aria-expanded',

        'true'

      );



      sizeMenu.hidden = false;

    }





    function toggleSizeMenu() {

      if (

        sizeDropdown.classList.contains(

          'is-open'

        )

      ) {

        closeSizeMenu();

      } else {

        openSizeMenu();

      }

    }





    function updateSizeTrigger() {

      if (selectedSize) {

        sizeText.textContent =

          selectedSize;



        sizeDropdown.classList.add(

          'has-selection'

        );

      } else {

        sizeText.textContent =

          'Choose your size';



        sizeDropdown.classList.remove(

          'has-selection'

        );

      }

    }





    function renderSizeOptions() {

      sizeMenu.replaceChildren();



      if (sizeOptionIndex < 0) {

        sizeGroup.hidden = true;



        selectedSize = '';



        updateSizeTrigger();



        return;

      }



      sizeGroup.hidden = false;



      const sizes =

        getAvailableValues(

          sizeOptionIndex

        );





      if (

        selectedSize &&

        !sizes.includes(selectedSize)

      ) {

        selectedSize = '';

      }





      sizes.forEach((size) => {

        const option =

          document.createElement('button');



        option.type = 'button';



        option.className =

          'gift-guide-modal__size-option';



        option.dataset.size = size;



        option.textContent = size;





        const available =

          isSizeAvailable(size);



        option.disabled = !available;





        const isSelected =

          Boolean(selectedSize) &&

          size === selectedSize;



        option.setAttribute(

          'aria-selected',

          String(isSelected)

        );



        if (isSelected) {

          option.classList.add(

            'is-selected'

          );

        }





        option.addEventListener(

          'click',

          () => {

            if (!available) {

              return;

            }



            selectedSize = size;



            closeSizeMenu();



            refreshOptions();

          }

        );





        sizeMenu.appendChild(option);

      });





      updateSizeTrigger();

    }





    sizeTrigger.addEventListener(

      'click',

      (event) => {

        event.preventDefault();

        event.stopPropagation();



        toggleSizeMenu();

      }

    );





    document.addEventListener(

      'click',

      (event) => {

        if (

          !sizeDropdown.contains(

            event.target

          )

        ) {

          closeSizeMenu();

        }

      }

    );





    /* =====================================================

       UPDATE VARIANT / ADD BUTTON

    ===================================================== */



    function updateSelectedVariant() {

      currentVariant =

        getSelectedVariant();





      if (currentVariant) {

        price.textContent =

          formatMoney(

            currentVariant.price

          );

      }





      const needsColor =

        colorOptionIndex >= 0;



      const needsSize =

        sizeOptionIndex >= 0;





      const optionsComplete =

        (!needsColor ||

          Boolean(selectedColor)) &&

        (!needsSize ||

          Boolean(selectedSize));





      const available =

        Boolean(

          currentVariant &&

          currentVariant.available

        );





      addButton.disabled =

        !optionsComplete ||

        !available;





      if (!optionsComplete) {

        addLabel.textContent =

          'ADD TO CART';



        updateMessage('');



        return;

      }





      if (!available) {

        addLabel.textContent =

          'UNAVAILABLE';



        updateMessage(

          'This combination is unavailable.',

          true

        );



        return;

      }





      addLabel.textContent =

        'ADD TO CART';



      updateMessage('');

    }





    /* =====================================================

       REFRESH

    ===================================================== */



    function refreshOptions() {

      renderColorOptions();



      renderSizeOptions();



      updateSelectedVariant();

    }





    /* =====================================================

       STRIP HTML

    ===================================================== */



    function stripHtml(value) {

      const temporary =

        document.createElement('div');



      temporary.innerHTML =

        value || '';



      return (

        temporary.textContent ||

        temporary.innerText ||

        ''

      );

    }





    /* =====================================================

       POPUP POSITION

       Open beside the exact + hotspot clicked

    ===================================================== */



    function positionPopupAtClick(trigger) {

      if (!trigger || !dialog) {

        return;

      }



      const rect =

        trigger.getBoundingClientRect();



      /*

       \* Read the actual rendered popup dimensions.

       \* Fall back to the Figma 311 x 447 dimensions.

       */

      const popupWidth =

        dialog.offsetWidth || 311;



      const popupHeight =

        dialog.offsetHeight || 447;



      const gap = 15;

      const edge = 15;





      /*

       \* Default:

       \* open on RIGHT side of clicked hotspot.

       */

      let left =

        rect.right + gap;





      /*

       \* Vertically center popup around hotspot.

       */

      let top =

        rect.top +

        rect.height / 2 -

        popupHeight / 2;





      /*

       \* If popup does not fit on right,

       \* open on LEFT side instead.

       */

      if (

        left + popupWidth >

        window.innerWidth - edge

      ) {

        left =

          rect.left -

          popupWidth -

          gap;

      }





      /*

       \* If neither side has perfect space,

       \* clamp popup inside viewport.

       */

      left = Math.max(

        edge,

        Math.min(

          left,

          window.innerWidth -

            popupWidth -

            edge

        )

      );





      /*

       \* Keep popup fully visible vertically.

       */

      top = Math.max(

        edge,

        Math.min(

          top,

          window.innerHeight -

            popupHeight -

            edge

        )

      );





      dialog.style.position =

        'fixed';



      dialog.style.transform =

        'none';



      dialog.style.margin =

        '0';



      dialog.style.left =

        `${Math.round(left)}px`;



      dialog.style.top =

        `${Math.round(top)}px`;



      dialog.style.right =

        'auto';



      dialog.style.bottom =

        'auto';

    }





    /* =====================================================

       RESET POPUP POSITION

    ===================================================== */



    function resetPopupPosition() {

      dialog.style.left = '';

      dialog.style.top = '';

      dialog.style.right = '';

      dialog.style.bottom = '';

      dialog.style.margin = '';

      dialog.style.transform = '';

    }





    /* =====================================================

       OPEN PRODUCT

    ===================================================== */



    function openProduct(

      product,

      trigger

    ) {

      if (

        !product ||

        !Array.isArray(

          product.variants

        )

      ) {

        return;

      }





      currentProduct = product;



      previousFocus =

        trigger ||

        document.activeElement;





      const names =

        getOptionNames(product);





      colorOptionIndex =

        getOptionIndex(

          names,

          /color|colour/i

        );





      sizeOptionIndex =

        getOptionIndex(

          names,

          /size/i

        );





      /*

       \* Fallback for imported test products.

       */



      if (

        colorOptionIndex < 0 &&

        names.length >= 2

      ) {

        colorOptionIndex = 0;

      }





      if (

        sizeOptionIndex < 0 &&

        names.length >= 2

      ) {

        sizeOptionIndex = 1;

      }





      otherOptionIndexes =

        names

          .map((_, index) => index)

          .filter(

            (index) =>

              index !==

                colorOptionIndex &&

              index !==

                sizeOptionIndex

          );





      const defaultVariant =

        product.variants.find(

          (variant) =>

            variant.available

        ) ||

        product.variants[0];





      /*

       \* NO COLOR PRESELECTED.

       \* NO SIZE PRESELECTED.

       */



      selectedColor = '';

      selectedSize = '';



      currentVariant = null;





      /* IMAGE */



      const productImage =

        getImageUrl(product);



      image.src =

        productImage || '';



      image.alt =

        product.title || '';



      image.hidden =

        !productImage;





      /* TITLE */



      title.textContent =

        product.title || '';





      /* DESCRIPTION */



      description.textContent =

        product.description

          ? stripHtml(

              product.description

            )

          : '';





      /* INITIAL PRICE */



      price.textContent =

        formatMoney(

          defaultVariant

            ? defaultVariant.price

            : 0

        );





      /* RESET SIZE */



      closeSizeMenu();



      sizeDropdown.classList.remove(

        'has-selection'

      );



      sizeText.textContent =

        'Choose your size';





      /* RENDER */



      refreshOptions();





      /*

       \* Remove positioning left from

       \* previous hotspot before opening.

       */



      resetPopupPosition();





      /* OPEN */



      modal.classList.add(

        'is-open'

      );



      modal.setAttribute(

        'aria-hidden',

        'false'

      );



      document.body.classList.add(

        'gift-guide-modal-open'

      );





      /*

       \* Wait until popup is visible so

       \* offsetWidth/offsetHeight are correct,

       \* then place it beside clicked +.

       */



      window.requestAnimationFrame(

        () => {

          positionPopupAtClick(

            trigger

          );



          dialog.focus();

        }

      );

    }





    /* =====================================================

       CLOSE MODAL

    ===================================================== */



    function closeModal() {

      closeSizeMenu();



      modal.classList.remove(

        'is-open'

      );



      modal.setAttribute(

        'aria-hidden',

        'true'

      );



      document.body.classList.remove(

        'gift-guide-modal-open'

      );



      updateMessage('');



      resetPopupPosition();





      if (

        previousFocus &&

        typeof previousFocus.focus ===

          'function'

      ) {

        previousFocus.focus();

      }

    }





    /* =====================================================

       READ PRODUCT JSON

    ===================================================== */



    function getProductFromButton(

      button

    ) {

      const productId =

        button.dataset.productId;



      if (!productId) {

        return null;

      }





      const productScript =

        document.getElementById(

          productId

        );





      if (!productScript) {

        console.error(

          `Gift Guide product JSON not found: ${productId}`

        );



        return null;

      }





      try {

        return JSON.parse(

          productScript.textContent

        );

      } catch (error) {

        console.error(

          'Gift Guide product JSON error:',

          error

        );



        return null;

      }

    }





    /* =====================================================

       HOTSPOTS

    ===================================================== */



    section

      .querySelectorAll(

        '[data-gift-open]'

      )

      .forEach((button) => {

        button.addEventListener(

          'click',

          () => {

            const product =

              getProductFromButton(

                button

              );



            if (!product) {

              return;

            }



            openProduct(

              product,

              button

            );

          }

        );

      });





    /* =====================================================

       CLOSE BUTTONS

    ===================================================== */



    section

      .querySelectorAll(

        '[data-gift-close]'

      )

      .forEach((button) => {

        button.addEventListener(

          'click',

          closeModal

        );

      });





    /* =====================================================

       ESCAPE

    ===================================================== */



    document.addEventListener(

      'keydown',

      (event) => {

        if (

          event.key ===

            'Escape' &&

          modal.classList.contains(

            'is-open'

          )

        ) {

          if (

            sizeDropdown.classList.contains(

              'is-open'

            )

          ) {

            closeSizeMenu();

          } else {

            closeModal();

          }

        }

      }

    );





    /* =====================================================
       CART REQUEST
    ===================================================== */

    async function addItemsToCart(items) {
      const root =
        window.Shopify &&
        window.Shopify.routes &&
        window.Shopify.routes.root
          ? window.Shopify.routes.root
          : '/';

      const response = await fetch(`${root}cart/add.js`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json'
        },
        body: JSON.stringify({ items })
      });

      let result = {};

      try {
        result = await response.json();
      } catch (error) {
        result = {};
      }

      if (!response.ok) {
        throw new Error(
          result.description ||
          result.message ||
          'Unable to add the product to your cart.'
        );
      }

      return result;
    }


    /* =====================================================
       BONUS PRODUCT
    ===================================================== */

    function getBonusProduct() {
      const bonusScript = section.querySelector(
        '[data-gift-bonus-product]'
      );

      if (!bonusScript) return null;

      try {
        return JSON.parse(bonusScript.textContent);
      } catch (error) {
        console.error(
          'Gift Guide bonus product JSON error:',
          error
        );
        return null;
      }
    }


    /* =====================================================
       BLACK + MEDIUM RULE
    ===================================================== */

   function matchesBonusRule(variant) {
  if (!variant) return false;

  const values = Array.isArray(variant.options)
    ? variant.options.map((value) =>
        String(value).trim().toLowerCase()
      )
    : [];

  const hasBlack = values.includes('black');

  const hasMedium =
    values.includes('medium') ||
    values.includes('m');

  return hasBlack && hasMedium;
}


    /* =====================================================
       ADD TO CART
    ===================================================== */

    addButton.addEventListener('click', async (event) => {
      event.preventDefault();
      event.stopPropagation();

      currentVariant = getSelectedVariant();

      if (!currentVariant) {
        updateMessage('Please select a color and size.', true);
        return;
      }

      if (!currentVariant.available) {
        updateMessage('This combination is unavailable.', true);
        return;
      }

      const variantId = Number(currentVariant.id);

      if (!variantId) {
        updateMessage(
          'This variant could not be selected. Please try again.',
          true
        );
        return;
      }

      const items = [{ id: variantId, quantity: 1 }];

      if (matchesBonusRule(currentVariant)) {
        const bonusProduct = getBonusProduct();

        if (
          !bonusProduct ||
          !Array.isArray(bonusProduct.variants)
        ) {
          updateMessage(
            'Please select Soft Winter Jacket in the Gift Guide section settings.',
            true
          );
          return;
        }

        const bonusVariant = bonusProduct.variants.find(
          (variant) => variant.available
        );

        if (!bonusVariant) {
          updateMessage(
            'The bonus product is currently unavailable.',
            true
          );
          return;
        }

        const bonusVariantId = Number(bonusVariant.id);

        if (bonusVariantId && bonusVariantId !== variantId) {
          items.push({
            id: bonusVariantId,
            quantity: 1
          });
        }
      }

      addButton.disabled = true;
      addLabel.textContent = 'ADDING...';
      updateMessage('');

      try {
        const result = await addItemsToCart(items);

        addLabel.textContent = 'ADDED!';

        updateMessage(
          items.length > 1
            ? 'Products added to your cart.'
            : 'Product added to your cart.'
        );

        document.dispatchEvent(
          new CustomEvent('gift-guide:cart-added', {
            bubbles: true,
            detail: { items, response: result }
          })
        );

        document.dispatchEvent(
          new CustomEvent('cart:refresh', {
            bubbles: true,
            detail: { source: 'gift-guide' }
          })
        );

        window.setTimeout(() => {
          closeModal();
          addLabel.textContent = 'ADD TO CART';
          updateSelectedVariant();
        }, 900);
      } catch (error) {
        console.error('Gift Guide cart error:', error);

        addLabel.textContent = 'ADD TO CART';

        updateMessage(
          error.message ||
          'Could not add to cart. Please try again.',
          true
        );

        updateSelectedVariant();
      }
    });


    /* =====================================================

       KEEP POPUP BESIDE CLICKED HOTSPOT

       IF VIEWPORT SIZE CHANGES

    ===================================================== */



    let resizeTimer = null;



    window.addEventListener(

      'resize',

      () => {

        if (

          !modal.classList.contains(

            'is-open'

          )

        ) {

          return;

        }



        if (!previousFocus) {

          return;

        }



        window.clearTimeout(

          resizeTimer

        );



        resizeTimer =

          window.setTimeout(

            () => {

              positionPopupAtClick(

                previousFocus

              );

            },

            80

          );

      }

    );

  }





  /* =======================================================

     INITIALIZE ALL

  ======================================================= */



  function initAllGiftGuideGrids() {

    document

      .querySelectorAll(

        '[data-gift-guide-grid]'

      )

      .forEach(

        initGiftGuideGrid

      );

  }





  if (

    document.readyState ===

    'loading'

  ) {

    document.addEventListener(

      'DOMContentLoaded',

      initAllGiftGuideGrids

    );

  } else {

    initAllGiftGuideGrids();

  }





  /* =======================================================

     SHOPIFY THEME EDITOR

  ======================================================= */



  document.addEventListener(

    'shopify:section:load',

    (event) => {

      const section =

        event.target.matches &&

        event.target.matches(

          '[data-gift-guide-grid]'

        )

          ? event.target

          : event.target.querySelector(

              '[data-gift-guide-grid]'

            );





      if (section) {

        delete section.dataset

          .giftInitialized;



        initGiftGuideGrid(

          section

        );

      }

    }

  );

})();