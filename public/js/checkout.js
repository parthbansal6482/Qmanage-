/**
 * Checkout page functionality.
 */

class CheckoutPage {
  constructor() {
    this.form = document.getElementById('checkoutForm');
    this.submitBtn = document.getElementById('submitOrderBtn');
    this.itemsList = document.getElementById('checkoutItemsList');
    this.emptyState = document.getElementById('checkoutEmptyState');
    this.subtotalEl = document.getElementById('checkoutSubtotal');
    this.feesEl = document.getElementById('checkoutFees');
    this.totalEl = document.getElementById('checkoutTotal');
    this.outletSelectorGroup = document.getElementById('outletSelectorGroup');
    this.outletSelect = document.getElementById('checkoutOutletSelect');
    this.outlets = window.__OUTLETS__ || [];

    this.bindEvents();
    this.loadCartData();
    this.initOutletSelector();
  }

  bindEvents() {
    if (this.form) {
      this.form.addEventListener('submit', (e) => {
        e.preventDefault();
        this.submitOrder();
      });
    }
    
    // Update cart outletId when user selects an outlet
    if (this.outletSelect) {
      this.outletSelect.addEventListener('change', (e) => {
        const selectedOutletId = e.target.value;
        if (selectedOutletId && window.cart) {
          // Validate it's a MongoDB ObjectId
          if (!/^[0-9a-fA-F]{24}$/.test(selectedOutletId)) {
            console.warn('Selected outlet ID is not a valid MongoDB ObjectId:', selectedOutletId);
            window.Utils.NotificationManager.show(
              'Warning: The selected outlet does not have a valid ID. The order may fail. Please ensure outlets are added to the database.',
              'warning',
              8000
            );
          }
          
          window.cart.outletId = selectedOutletId;
          
          // Also update items that don't have outletId
          if (window.cart.items) {
            window.cart.items.forEach(item => {
              if (!item.outletId) {
                item.outletId = selectedOutletId;
              }
            });
          }
          
          window.cart.saveCart();
          console.log('Updated cart outletId from selector:', selectedOutletId);
        }
      });
    }
  }

  initOutletSelector() {
    // Always try to fetch from API first to get outlets with MongoDB _id
    this.fetchOutlets();
    
    // Also populate with window.__OUTLETS__ as fallback
    if (this.outlets && this.outlets.length > 0) {
      this.populateOutletSelector();
    }
  }

  async fetchOutlets() {
    try {
      const response = await fetch('/api/outlets');
      if (response.ok) {
        const data = await response.json();
        const apiOutlets = data.outlets || data || [];
        
        if (apiOutlets.length > 0) {
          // Use API outlets (they have MongoDB _id)
          this.outlets = apiOutlets;
          console.log('Loaded outlets from API:', apiOutlets.length);
          this.populateOutletSelector();
        } else {
          // API is empty, use window.__OUTLETS__ as fallback
          console.warn('API returned empty outlets. Using window.__OUTLETS__ as fallback.');
          if (window.__OUTLETS__ && window.__OUTLETS__.length > 0) {
            this.outlets = window.__OUTLETS__;
            this.populateOutletSelector();
          }
        }
      } else {
        console.warn('Failed to fetch outlets from API:', response.status);
        // Fallback to window.__OUTLETS__
        if (window.__OUTLETS__ && window.__OUTLETS__.length > 0) {
          this.outlets = window.__OUTLETS__;
          this.populateOutletSelector();
        }
      }
    } catch (error) {
      console.error('Failed to fetch outlets:', error);
      // Fallback to window.__OUTLETS__
      if (window.__OUTLETS__ && window.__OUTLETS__.length > 0) {
        this.outlets = window.__OUTLETS__;
        this.populateOutletSelector();
      }
    }
  }

  populateOutletSelector() {
    if (!this.outletSelect || !this.outlets || this.outlets.length === 0) {
      return;
    }

    // Clear existing options except the first one
    this.outletSelect.innerHTML = '<option value="">Please select an outlet</option>';
    
    this.outlets.forEach((outlet) => {
      const option = document.createElement('option');
      // Prefer MongoDB _id, fallback to id, then name
      const outletValue = outlet._id || outlet.id || outlet.name;
      option.value = outletValue;
      option.textContent = outlet.name;
      
      // Store the outlet name for reference
      option.dataset.outletName = outlet.name;
      
      this.outletSelect.appendChild(option);
    });
    
    console.log('Populated outlet selector with', this.outlets.length, 'outlets');
  }

  loadCartData() {
    // Wait for cart to be initialized
    this.waitForCart();
  }

  waitForCart() {
    if (window.cart) {
      this.renderCartData();
    } else {
      // Try to load cart from localStorage as fallback
      const cartItems = JSON.parse(localStorage.getItem('cartItems')) || [];
      let outletId = localStorage.getItem('cartOutletId') || null;
      
      // If outletId is not in localStorage but items have it, extract it
      if (!outletId && cartItems.length > 0) {
        const itemWithOutlet = cartItems.find(item => item.outletId);
        if (itemWithOutlet) {
          outletId = itemWithOutlet.outletId;
          // Save it to localStorage for future use
          localStorage.setItem('cartOutletId', outletId);
        }
      }
      
      if (cartItems.length > 0) {
        // Create a temporary cart object if window.cart isn't ready yet
        const tempCart = {
          items: cartItems,
          outletId: outletId,
          getTotalAmount: function() {
            return this.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
          },
          saveCart: function() {
            // This will be handled by the real cart when it initializes
            localStorage.setItem('cartItems', JSON.stringify(this.items));
            if (this.outletId) {
              localStorage.setItem('cartOutletId', this.outletId);
            }
          }
        };
        window.cart = tempCart;
        this.renderCartData();
      } else {
        // Wait a bit and try again if cart is still initializing
        setTimeout(() => this.waitForCart(), 100);
      }
    }
  }

  renderCartData() {
    if (!window.cart || !window.cart.items || window.cart.items.length === 0) {
      console.log('Cart is empty or not found');
      this.showEmptyState();
      return;
    }

    const items = window.cart.items;
    console.log('Loading cart data:', items);
    console.log('Cart outletId:', window.cart.outletId);
    
    // Try to extract outletId from items if cart doesn't have it
    if (!window.cart.outletId && items && items.length > 0) {
      const itemWithOutlet = items.find(item => item && item.outletId);
      if (itemWithOutlet && itemWithOutlet.outletId) {
        window.cart.outletId = itemWithOutlet.outletId;
        if (window.cart.saveCart) {
          window.cart.saveCart();
        } else {
          localStorage.setItem('cartOutletId', itemWithOutlet.outletId);
        }
        console.log('Extracted and set outletId from items:', itemWithOutlet.outletId);
      }
    }
    
    // Also check localStorage as fallback
    if (!window.cart.outletId) {
      const storedOutletId = localStorage.getItem('cartOutletId');
      if (storedOutletId) {
        window.cart.outletId = storedOutletId;
        console.log('Loaded outletId from localStorage:', storedOutletId);
      }
    }
    
    // Always render items first, even if validation fails
    this.renderItems(items);
    this.updateSummary();

    // Check validation but don't redirect automatically
    const outletId = window.cart.outletId || items[0]?.outletId;

    if (!outletId) {
      console.log('No outlet ID found - showing outlet selector');
      // Show outlet selector if outletId is missing
      if (this.outletSelectorGroup) {
        this.outletSelectorGroup.style.display = 'block';
        // Make the select required
        if (this.outletSelect) {
          this.outletSelect.required = true;
        }
      }
      window.Utils.NotificationManager.show(
        'Please select an outlet to complete your order.',
        'warning',
        5000
      );
      // Don't redirect automatically - let user select outlet and complete checkout
      return;
    } else {
      // Hide outlet selector if outletId exists
      if (this.outletSelectorGroup) {
        this.outletSelectorGroup.style.display = 'none';
        if (this.outletSelect) {
          this.outletSelect.required = false;
        }
      }
    }

    const itemsWithoutMenuItemId = items.filter(item => !item.menuItemId);
    if (itemsWithoutMenuItemId.length > 0) {
      console.log('Items missing menuItemId:', itemsWithoutMenuItemId);
      window.Utils.NotificationManager.show(
        'Warning: Some items may be missing menu information. The order may fail if items were not added from the Order page.',
        'warning',
        5000
      );
      // Don't redirect automatically - let user try to complete checkout
      return;
    }

    console.log('Cart validation passed');
  }

  showEmptyState() {
    if (this.emptyState) {
      this.emptyState.hidden = false;
    }
    if (this.form) {
      this.form.style.display = 'none';
    }
    if (document.querySelector('.checkout-summary')) {
      document.querySelector('.checkout-summary').style.display = 'none';
    }
  }

  renderItems(items) {
    if (!this.itemsList) {
      console.error('checkoutItemsList element not found');
      return;
    }

    console.log('Rendering items:', items);
    this.itemsList.innerHTML = '';
    
    if (!items || items.length === 0) {
      console.log('No items to render');
      return;
    }

    const fragment = document.createDocumentFragment();

    items.forEach((item) => {
      console.log('Rendering item:', item);
      const itemEl = document.createElement('div');
      itemEl.className = 'checkout-item';
      itemEl.innerHTML = `
        <div class="checkout-item-info">
          <img src="${item.image || '/img/373.png'}" alt="${item.name}" class="checkout-item-image" loading="lazy" onerror="this.src='/img/373.png'">
          <div>
            <h4>${item.name || 'Unknown Item'}</h4>
            <p>₹${Number(item.price || 0).toFixed(2)} each</p>
          </div>
        </div>
        <div class="checkout-item-quantity">
          <span>Qty: ${item.quantity || 1}</span>
          <span class="checkout-item-total">₹${((item.price || 0) * (item.quantity || 1)).toFixed(2)}</span>
        </div>
      `;
      fragment.appendChild(itemEl);
    });

    this.itemsList.appendChild(fragment);
    console.log('Items rendered successfully');
  }

  updateSummary() {
    if (!window.cart) return;

    const subtotal = window.cart.getTotalAmount();
    const fees = subtotal * 0.05;
    const total = subtotal + fees;

    if (this.subtotalEl) this.subtotalEl.textContent = `₹${subtotal.toFixed(2)}`;
    if (this.feesEl) this.feesEl.textContent = `₹${fees.toFixed(2)}`;
    if (this.totalEl) this.totalEl.textContent = `₹${total.toFixed(2)}`;
  }

  async submitOrder() {
    if (!window.cart || window.cart.items.length === 0) {
      window.Utils.NotificationManager.show('Your cart is empty.', 'warning');
      return;
    }

    const submitBtn = this.submitBtn;
    const originalText = submitBtn ? submitBtn.textContent : 'Place Order';
    
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = 'Placing Order...';
    }

    const customerName = document.getElementById('customerName')?.value.trim();
    const customerEmail = document.getElementById('customerEmail')?.value.trim();
    const customerPhone = document.getElementById('customerPhone')?.value.trim();
    const notes = document.getElementById('orderNotes')?.value.trim() || '';

    // Validate
    if (!window.Utils.FormValidator.validateRequired(customerName)) {
      window.Utils.NotificationManager.show('Please enter your name.', 'warning');
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
      }
      return;
    }

    if (!window.Utils.FormValidator.validateEmail(customerEmail)) {
      window.Utils.NotificationManager.show('Please enter a valid email address.', 'warning');
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
      }
      return;
    }

    if (!window.Utils.FormValidator.validatePhone(customerPhone)) {
      window.Utils.NotificationManager.show('Please enter a valid phone number.', 'warning');
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
      }
      return;
    }

    try {
      const items = window.cart.items;
      
      // Debug logging
      console.log('=== Checkout Debug Info ===');
      console.log('Cart object:', window.cart);
      console.log('Cart items:', items);
      console.log('Cart outletId:', window.cart.outletId);
      console.log('Items with outletId:', items.map(item => ({ name: item.name, outletId: item.outletId })));
      
      // Try multiple ways to get outletId
      let outletId = window.cart.outletId;
      
      // Check localStorage directly as fallback
      if (!outletId) {
        outletId = localStorage.getItem('cartOutletId');
        if (outletId) {
          console.log('Found outletId in localStorage:', outletId);
          window.cart.outletId = outletId;
        }
      }
      
      // If cart doesn't have outletId, try to get it from items
      if (!outletId && items && items.length > 0) {
        // Find the first item with an outletId
        const itemWithOutlet = items.find(item => item && item.outletId);
        if (itemWithOutlet && itemWithOutlet.outletId) {
          outletId = itemWithOutlet.outletId;
          // Update cart with the found outletId
          window.cart.outletId = outletId;
          if (window.cart.saveCart) {
            window.cart.saveCart();
          } else {
            localStorage.setItem('cartOutletId', outletId);
          }
          console.log('Extracted outletId from items:', outletId);
        }
      }

      // Check if user selected an outlet from the dropdown
      if (!outletId && this.outletSelect) {
        const selectedOutletId = this.outletSelect.value;
        if (selectedOutletId) {
          outletId = selectedOutletId;
          // Update cart with selected outlet
          window.cart.outletId = outletId;
          if (window.cart.saveCart) {
            window.cart.saveCart();
          } else {
            localStorage.setItem('cartOutletId', outletId);
          }
          console.log('Using outletId from selector:', outletId);
        }
      }

      console.log('Final outletId before validation:', outletId);

      if (!outletId) {
        console.error('No outletId found. Cart state:', {
          cartOutletId: window.cart.outletId,
          localStorageOutletId: localStorage.getItem('cartOutletId'),
          selectedOutletId: this.outletSelect?.value,
          items: items.map(item => ({ name: item.name, outletId: item.outletId, menuItemId: item.menuItemId }))
        });
        
        // Show outlet selector if it's not already visible
        if (this.outletSelectorGroup) {
          this.outletSelectorGroup.style.display = 'block';
          if (this.outletSelect) {
            this.outletSelect.required = true;
            this.outletSelect.focus();
          }
        }
        
        throw new Error('Please select an outlet to complete your order.');
      }

      // Validate that outletId is a MongoDB ObjectId format (24 hex characters)
      // If it's not, try to find the outlet by name and get its _id
      if (!/^[0-9a-fA-F]{24}$/.test(outletId)) {
        console.warn('Outlet ID is not in ObjectId format, attempting to resolve:', outletId);
        
        let outlets = [];
        
        // First, try to use outlets from window.__OUTLETS__ (if available from order page)
        if (window.__OUTLETS__ && Array.isArray(window.__OUTLETS__) && window.__OUTLETS__.length > 0) {
          console.log('Using outlets from window.__OUTLETS__');
          outlets = window.__OUTLETS__;
        } else {
          // Try to fetch outlets from API
          try {
            const outletsResponse = await fetch('/api/outlets');
            if (outletsResponse.ok) {
              const outletsData = await outletsResponse.json();
              console.log('Fetched outlets data:', outletsData);
              
              // Handle different possible response formats
              outlets = outletsData.outlets || outletsData || [];
            } else {
              console.error('Failed to fetch outlets, status:', outletsResponse.status);
            }
          } catch (fetchError) {
            console.error('Error fetching outlets:', fetchError);
          }
        }
        
        console.log('Outlets array:', outlets);
        
        if (outlets.length === 0) {
          throw new Error('Unable to fetch outlets. Please refresh the page and try again.');
        }
        
        // Helper function to convert name to slug (matching outlets.js logic)
        const nameToSlug = (name) => {
          if (!name) return '';
          return String(name).toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '').trim();
        };
        
        // Try to find outlet by name (case-insensitive, trim whitespace, or slug)
        const searchTerm = outletId.trim();
        const searchName = searchTerm.toLowerCase();
        const searchSlug = nameToSlug(searchTerm);
        console.log('Searching for outlet. Original:', outletId, '| Lowercase:', searchName, '| Slug:', searchSlug);
        
        const outlet = outlets.find(o => {
          if (!o) return false;
          
          // Try exact _id match first
          const outletIdStr = String(o._id || '');
          if (outletIdStr === outletId || outletIdStr === searchTerm) {
            console.log('Found outlet by _id match:', o.name, '->', o._id);
            return true;
          }
          
          // Try name match (case-insensitive, trimmed, or slug)
          if (o.name) {
            const outletName = String(o.name).trim().toLowerCase();
            const outletSlug = nameToSlug(o.name);
            
            console.log(`  Checking outlet "${o.name}": name="${outletName}", slug="${outletSlug}"`);
            
            // Exact name match
            if (outletName === searchName) {
              console.log('Found outlet by exact name match:', o.name, '->', o._id);
              return true;
            }
            
            // Slug match (e.g., "burger-singh" matches "Burger Singh")
            if (outletSlug === searchSlug) {
              console.log('Found outlet by slug match:', o.name, '->', o._id);
              return true;
            }
            
            // Also try if search term is a slug and matches outlet slug
            if (outletSlug === searchName || outletName === searchSlug) {
              console.log('Found outlet by cross-slug/name match:', o.name, '->', o._id);
              return true;
            }
            
            // Partial match (contains) - as last resort
            if (outletName.includes(searchName) || searchName.includes(outletName)) {
              console.log('Found outlet by partial name match:', o.name, '->', o._id);
              return true;
            }
          }
          
          return false;
        });
        
        if (outlet) {
          // Debug: log the outlet object structure
          console.log('Found outlet object:', outlet);
          console.log('Outlet keys:', Object.keys(outlet));
          console.log('Outlet._id:', outlet._id);
          console.log('Outlet.id:', outlet.id);
          
          // Try to get _id from outlet object (check multiple possible properties)
          const resolvedId = outlet._id || outlet.id || null;
          
          // Check if resolvedId is a valid MongoDB ObjectId (24 hex characters)
          const isValidObjectId = resolvedId && /^[0-9a-fA-F]{24}$/.test(String(resolvedId));
          
          if (resolvedId && isValidObjectId) {
            outletId = resolvedId;
            console.log('Resolved outlet ID (valid ObjectId):', outletId, 'from outlet:', outlet.name);
            // Update cart with correct outlet ID
            window.cart.outletId = outletId;
            window.cart.saveCart();
          } else {
            // Has an ID but it's not a valid ObjectId (likely a slug), or no ID at all - fetch from API
            if (resolvedId && !isValidObjectId) {
              console.warn('Outlet has ID but it\'s not a valid MongoDB ObjectId:', resolvedId);
            } else {
              console.warn('Outlet found but has no ID. Outlet object:', outlet);
            }
            console.log('Attempting to fetch outlet from API by name:', outlet.name);
            
            try {
              const apiResponse = await fetch(`/api/outlets`);
              if (apiResponse.ok) {
                const apiData = await apiResponse.json();
                const apiOutlets = apiData.outlets || apiData || [];
                
                console.log('API response data:', apiData);
                console.log('API outlets array:', apiOutlets);
                console.log('Searching for outlet:', outlet.name);
                console.log('API outlets names:', apiOutlets.map(o => o.name));
                
                const searchNameLower = String(outlet.name || '').trim().toLowerCase();
                const searchSlug = nameToSlug(outlet.name || '');
                
                const apiOutlet = apiOutlets.find(o => {
                  if (!o || !o.name) return false;
                  
                  const oName = String(o.name || '').trim().toLowerCase();
                  const oSlug = nameToSlug(o.name || '');
                  
                  console.log(`  Comparing: "${o.name}" (name: "${oName}", slug: "${oSlug}") with search (name: "${searchNameLower}", slug: "${searchSlug}")`);
                  
                  const nameMatch = oName === searchNameLower;
                  const slugMatch = oSlug === searchSlug;
                  
                  if (nameMatch || slugMatch) {
                    console.log(`  ✓ Match found!`);
                    return true;
                  }
                  
                  return false;
                });
                
                if (apiOutlet) {
                  console.log('Found outlet in API:', apiOutlet);
                  const apiId = apiOutlet._id || apiOutlet.id;
                  
                  if (apiId) {
                    // Verify it's a valid ObjectId
                    if (/^[0-9a-fA-F]{24}$/.test(String(apiId))) {
                      outletId = apiId;
                      console.log('Fetched outlet ID from API:', outletId);
                      window.cart.outletId = outletId;
                      window.cart.saveCart();
                    } else {
                      console.warn('API returned ID but it\'s not a valid ObjectId:', apiId);
                      throw new Error(`API returned invalid outlet ID format: ${apiId}`);
                    }
                  } else {
                    console.error('API outlet found but has no _id or id:', apiOutlet);
                    throw new Error(`API outlet "${apiOutlet.name}" has no ID field.`);
                  }
                } else {
                  // API returned empty or outlet not found
                  if (apiOutlets.length === 0) {
                    console.warn('API returned empty outlets array. This might mean the database is empty or using sample data.');
                    console.log('Showing outlet selector as fallback...');
                    
                    // Show outlet selector and ask user to select
                    if (this.outletSelectorGroup && this.outletSelect) {
                      this.outletSelectorGroup.style.display = 'block';
                      this.outletSelect.required = true;
                      this.outletSelect.focus();
                      
                      // Scroll to selector
                      this.outletSelectorGroup.scrollIntoView({ behavior: 'smooth', block: 'center' });
                      
                      throw new Error('Please select an outlet from the dropdown above. The outlet database appears to be empty or not synchronized.');
                    } else {
                      throw new Error(`Could not find outlet "${outlet.name}" in API response. The database may be empty. Please refresh the page or contact support.`);
                    }
                  } else {
                    console.error('Could not find outlet in API response. Available outlets:', apiOutlets.map(o => ({
                      name: o.name,
                      _id: o._id,
                      id: o.id
                    })));
                    throw new Error(`Could not find outlet "${outlet.name}" in API response. Available: ${apiOutlets.map(o => o.name).join(', ')}`);
                  }
                }
              } else {
                const errorText = await apiResponse.text();
                console.error('API response error:', apiResponse.status, errorText);
                throw new Error(`Failed to fetch outlets from API: ${apiResponse.status} - ${errorText}`);
              }
            } catch (apiError) {
              console.error('Error fetching outlet from API:', apiError);
              throw new Error(`Outlet "${outlet.name}" was found but its ID could not be retrieved. Please try refreshing the page or selecting the outlet again from the Order page.`);
            }
          }
        } else {
          console.error('Outlet not found. Searching for:', outletId);
          console.error('Available outlets:', outlets.map(o => ({ 
            name: o.name, 
            nameLower: o.name?.toLowerCase(), 
            _id: o._id,
            id: o.id,
            allKeys: Object.keys(o)
          })));
          throw new Error(`Outlet "${outletId}" not found. Available outlets: ${outlets.map(o => o.name).join(', ')}`);
        }
      }

      // Validate and resolve menu item IDs
      console.log('Validating menu item IDs...');
      const validatedItems = [];
      
      for (const item of items) {
        let menuItemId = item.menuItemId;
        
        // Check if menuItemId is a valid MongoDB ObjectId
        const isValidObjectId = menuItemId && /^[0-9a-fA-F]{24}$/.test(String(menuItemId));
        
        if (!isValidObjectId) {
          console.warn(`Menu item "${item.name}" has invalid ID: ${menuItemId}. Attempting to resolve from API...`);
          
          try {
            // Fetch menu items from API for this outlet
            const menuResponse = await fetch(`/api/menu-items?outlet=${encodeURIComponent(outletId)}`);
            if (menuResponse.ok) {
              const menuData = await menuResponse.json();
              const apiMenuItems = menuData.menuItems || [];
              
              // Try to find the menu item by name
              const apiMenuItem = apiMenuItems.find(mi => {
                const miName = String(mi.name || '').trim().toLowerCase();
                const itemName = String(item.name || '').trim().toLowerCase();
                return miName === itemName;
              });
              
              if (apiMenuItem && apiMenuItem._id) {
                menuItemId = apiMenuItem._id;
                // Update the cart item with the correct ID
                item.menuItemId = menuItemId;
                console.log(`Resolved menu item "${item.name}" to MongoDB ID: ${menuItemId}`);
              } else {
                throw new Error(`Menu item "${item.name}" not found in API for outlet. Please add items from the Order page after selecting an outlet.`);
              }
            } else {
              throw new Error(`Failed to fetch menu items from API: ${menuResponse.status}`);
            }
          } catch (resolveError) {
            console.error('Error resolving menu item ID:', resolveError);
            throw new Error(`Menu item "${item.name}" has an invalid ID and could not be resolved. Please remove it from your cart and add it again from the Order page.`);
          }
        }
        
        validatedItems.push({
          menuItem: menuItemId,
          quantity: item.quantity
        });
      }
      
      // Save updated cart items if any were resolved
      if (window.cart.saveCart) {
        window.cart.saveCart();
      }
      
      // Prepare order data
      const orderData = {
        customer: {
          name: customerName,
          email: customerEmail,
          phone: customerPhone
        },
        outlet: outletId,
        items: validatedItems,
        notes: notes
      };
      
      console.log('Submitting order with outlet ID:', outletId);
      console.log('Order items:', validatedItems);

      // Submit order
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(orderData)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to place order');
      }

      const data = await response.json();
      
      // Success - clear cart and show confirmation
      window.cart.items = [];
      window.cart.outletId = null;
      window.cart.saveCart();
      window.cart.updateCartDisplay();
      
      window.Utils.NotificationManager.show(
        `Order placed successfully! Order ID: ${data.order._id}`,
        'success',
        5000
      );

      // Redirect to home page
      setTimeout(() => {
        window.location.href = '/';
      }, 2000);

    } catch (error) {
      console.error('Order submission error:', error);
      window.Utils.NotificationManager.show(
        error.message || 'Failed to place order. Please try again.',
        'error'
      );
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
      }
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  if (document.body.classList.contains('page-checkout')) {
    new CheckoutPage();
  }
});

