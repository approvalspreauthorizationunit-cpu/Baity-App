import React, { createContext, useContext, useReducer, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../lib/supabase';

const AppContext = createContext();

const initialState = {
  isLoading: true,
  isLoggedIn: false,
  user: null,
  sellers: [],
  cart: {
    items: [],
    sellerId: null,
    sellerName: null,
    donation: 0,
    isMealDonation: false,
  },
  orders: [],
};

function appReducer(state, action) {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };

    case 'LOGIN':
      return {
        ...state,
        isLoggedIn: true,
        user: action.payload,
        isLoading: false,
      };

    case 'LOGOUT':
      return {
        ...state,
        isLoggedIn: false,
        user: null,
        cart: { items: [], sellerId: null, sellerName: null, donation: 0, isMealDonation: false },
      };

    case 'SWITCH_MODE':
      return {
        ...state,
        user: { ...state.user, mode: action.payload },
      };

    case 'ADD_TO_CART': {
      const { product, seller } = action.payload;
      // If different seller, clear cart
      if (state.cart.sellerId && state.cart.sellerId !== seller.id) {
        return {
          ...state,
          cart: {
            items: [{ ...product, quantity: 1 }],
            sellerId: seller.id,
            sellerName: seller.name,
            donation: 0,
            isMealDonation: false,
          },
        };
      }
      const existingIndex = state.cart.items.findIndex(i => i.id === product.id);
      let newItems;
      if (existingIndex >= 0) {
        newItems = state.cart.items.map((item, idx) =>
          idx === existingIndex ? { ...item, quantity: item.quantity + 1 } : item
        );
      } else {
        newItems = [...state.cart.items, { ...product, quantity: 1 }];
      }
      return {
        ...state,
        cart: {
          ...state.cart,
          items: newItems,
          sellerId: seller.id,
          sellerName: seller.name,
        },
      };
    }

    case 'REMOVE_FROM_CART': {
      const productId = action.payload;
      const existingIndex = state.cart.items.findIndex(i => i.id === productId);
      if (existingIndex < 0) return state;
      const item = state.cart.items[existingIndex];
      let newItems;
      if (item.quantity <= 1) {
        newItems = state.cart.items.filter(i => i.id !== productId);
      } else {
        newItems = state.cart.items.map(i =>
          i.id === productId ? { ...i, quantity: i.quantity - 1 } : i
        );
      }
      const newCart = newItems.length === 0
        ? { items: [], sellerId: null, sellerName: null, donation: 0, isMealDonation: false }
        : { ...state.cart, items: newItems };
      return { ...state, cart: newCart };
    }

    case 'UPDATE_CART_ITEM': {
      const { productId, quantity } = action.payload;
      if (quantity <= 0) {
        const newItems = state.cart.items.filter(i => i.id !== productId);
        const newCart = newItems.length === 0
          ? { items: [], sellerId: null, sellerName: null, donation: 0, isMealDonation: false }
          : { ...state.cart, items: newItems };
        return { ...state, cart: newCart };
      }
      return {
        ...state,
        cart: {
          ...state.cart,
          items: state.cart.items.map(i =>
            i.id === productId ? { ...i, quantity } : i
          ),
        },
      };
    }

    case 'SET_DONATION':
      return {
        ...state,
        cart: {
          ...state.cart,
          donation: action.payload.amount,
          isMealDonation: action.payload.isMeal || false,
        },
      };

    case 'CLEAR_CART':
      return {
        ...state,
        cart: { items: [], sellerId: null, sellerName: null, donation: 0, isMealDonation: false },
      };

    case 'PLACE_ORDER': {
      const newOrder = {
        ...action.payload,
        id: 'o' + Date.now(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        status: 'pending',
        timeline: [
          { status: 'pending', time: new Date().toISOString(), label: 'تم استلام الطلب' },
        ],
      };
      return {
        ...state,
        orders: [newOrder, ...state.orders],
        cart: { items: [], sellerId: null, sellerName: null, donation: 0, isMealDonation: false },
      };
    }

    case 'UPDATE_ORDER_STATUS': {
      const { orderId, status } = action.payload;
      const statusLabels = {
        accepted: 'تم قبول الطلب',
        preparing: 'جاري التحضير',
        ready: 'جاهز للتوصيل',
        delivered: 'تم التوصيل',
        cancelled: 'تم إلغاء الطلب',
      };
      return {
        ...state,
        orders: state.orders.map(o => {
          if (o.id !== orderId) return o;
          const newTimeline = [...o.timeline, {
            status,
            time: new Date().toISOString(),
            label: statusLabels[status] || status,
          }];
          return { ...o, status, updatedAt: new Date().toISOString(), timeline: newTimeline };
        }),
      };
    }

    case 'ADD_PRODUCT': {
      const { sellerId, product } = action.payload;
      return {
        ...state,
        sellers: state.sellers.map(s => {
          if (s.id !== sellerId) return s;
          return {
            ...s,
            products: [...s.products, { ...product, id: 'p' + Date.now() }],
          };
        }),
      };
    }

    case 'UPDATE_PRODUCT': {
      const { sellerId, product } = action.payload;
      return {
        ...state,
        sellers: state.sellers.map(s => {
          if (s.id !== sellerId) return s;
          return {
            ...s,
            products: s.products.map(p => p.id === product.id ? product : p),
          };
        }),
      };
    }

    case 'DELETE_PRODUCT': {
      const { sellerId, productId } = action.payload;
      return {
        ...state,
        sellers: state.sellers.map(s => {
          if (s.id !== sellerId) return s;
          return { ...s, products: s.products.filter(p => p.id !== productId) };
        }),
      };
    }

    case 'TOGGLE_PRODUCT_AVAILABILITY': {
      const { sellerId, productId } = action.payload;
      return {
        ...state,
        sellers: state.sellers.map(s => {
          if (s.id !== sellerId) return s;
          return {
            ...s,
            products: s.products.map(p =>
              p.id === productId ? { ...p, available: !p.available } : p
            ),
          };
        }),
      };
    }

    case 'TOGGLE_SELLER_ONLINE': {
      const sellerId = action.payload;
      return {
        ...state,
        sellers: state.sellers.map(s =>
          s.id === sellerId ? { ...s, isOnline: !s.isOnline } : s
        ),
      };
    }

    case 'UPDATE_USER':
      return { ...state, user: { ...state.user, ...action.payload } };

    default:
      return state;
  }
}

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  const loadStoredData = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) {
        const { data: profile } = await supabase
          .from('users')
          .select('*')
          .eq('id', session.user.id)
          .single()

        if (profile) {
          let sellerStatus = null;
          if (profile.role === 'seller') {
            const { data: sellerProfile } = await supabase
              .from('seller_profiles')
              .select('status')
              .eq('user_id', session.user.id)
              .single();
            sellerStatus = sellerProfile?.status;
          }
          dispatch({ type: 'LOGIN', payload: { ...profile, sellerStatus, supabaseUser: session.user } })
        } else {
          dispatch({ type: 'SET_LOADING', payload: false })
        }
      } else {
        dispatch({ type: 'SET_LOADING', payload: false })
      }
    } catch (e) {
      dispatch({ type: 'SET_LOADING', payload: false })
    }
  }

  useEffect(() => {
    loadStoredData()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_OUT') {
          dispatch({ type: 'LOGOUT' })
        }
      }
    )
    return () => subscription.unsubscribe()
  }, [])

  const login = async (userData) => {
    dispatch({ type: 'LOGIN', payload: userData })
  }

  const logout = async () => {
    await supabase.auth.signOut()
    dispatch({ type: 'LOGOUT' })
  }

  const switchMode = (mode) => {
    const updatedUser = { ...state.user, mode };
    // AsyncStorage.setItem('user', JSON.stringify(updatedUser)); // We don't need this anymore as we use Supabase session
    dispatch({ type: 'SWITCH_MODE', payload: mode });
  };

  const addToCart = (product, seller) => {
    dispatch({ type: 'ADD_TO_CART', payload: { product, seller } });
  };

  const removeFromCart = (productId) => {
    dispatch({ type: 'REMOVE_FROM_CART', payload: productId });
  };

  const updateCartItem = (productId, quantity) => {
    dispatch({ type: 'UPDATE_CART_ITEM', payload: { productId, quantity } });
  };

  const setDonation = (amount, isMeal = false) => {
    dispatch({ type: 'SET_DONATION', payload: { amount, isMeal } });
  };

  const clearCart = () => {
    dispatch({ type: 'CLEAR_CART' });
  };

  const placeOrder = (orderData) => {
    dispatch({ type: 'PLACE_ORDER', payload: orderData });
  };

  const updateOrderStatus = (orderId, status) => {
    dispatch({ type: 'UPDATE_ORDER_STATUS', payload: { orderId, status } });
  };

  const addProduct = (sellerId, product) => {
    dispatch({ type: 'ADD_PRODUCT', payload: { sellerId, product } });
  };

  const updateProduct = (sellerId, product) => {
    dispatch({ type: 'UPDATE_PRODUCT', payload: { sellerId, product } });
  };

  const deleteProduct = (sellerId, productId) => {
    dispatch({ type: 'DELETE_PRODUCT', payload: { sellerId, productId } });
  };

  const toggleProductAvailability = (sellerId, productId) => {
    dispatch({ type: 'TOGGLE_PRODUCT_AVAILABILITY', payload: { sellerId, productId } });
  };

  const toggleSellerOnline = (sellerId) => {
    dispatch({ type: 'TOGGLE_SELLER_ONLINE', payload: sellerId });
  };

  const updateUser = (data) => {
    const updatedUser = { ...state.user, ...data };
    // AsyncStorage.setItem('user', JSON.stringify(updatedUser));
    dispatch({ type: 'UPDATE_USER', payload: data });
  };

  const getCartCount = () => {
    return state.cart.items.reduce((sum, item) => sum + item.quantity, 0);
  };

  const getCartTotal = () => {
    return state.cart.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  };

  const getMySellerProfile = () => {
    if (!state.user?.sellerProfile?.sellerId) return null;
    return state.sellers.find(s => s.id === state.user.sellerProfile.sellerId);
  };

  const getSellerOrders = (sellerId) => {
    return state.orders.filter(o => o.sellerId === sellerId);
  };

  const value = {
    ...state,
    login,
    logout,
    switchMode,
    addToCart,
    removeFromCart,
    updateCartItem,
    setDonation,
    clearCart,
    placeOrder,
    updateOrderStatus,
    addProduct,
    updateProduct,
    deleteProduct,
    toggleProductAvailability,
    toggleSellerOnline,
    updateUser,
    getCartCount,
    getCartTotal,
    getMySellerProfile,
    getSellerOrders,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
}
