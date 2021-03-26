import { createContext, ReactNode, useContext, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product, Stock } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem('@RocketShoes:cart');

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  const addProduct = async (productId: number) => {
    try {
      let response = await api.get('/stock');
      const stock = response.data;
      const productInStock = stock.find((product: Stock) => product.id === productId);
      
      response = await api.get(`/products/${productId}`);
      const product = response.data;

      const productInTheCart = cart.find(product => product.id === productId);

      if(productInTheCart) {
        if(productInTheCart.amount >= productInStock.amount) {
          toast.error('Quantidade solicitada fora de estoque');
          return;
        }

        const newCart = cart.map(product => {
          if(product.id === productInTheCart.id)
            product.amount ++;

          return product;
        });

        setCart(newCart);
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(cart));
      } else {
        const newCart = [ ...cart, { ...product, amount: 1 } ];

        setCart(newCart);
        console.log({newCart});
        console.log({cart});
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(cart));
      }
    } catch {
      toast.error('Erro na adição do produto');
    }
  };

  const removeProduct = (productId: number) => {
    try {
      const filteredCart = cart.filter(product => product.id !== productId);

      setCart(filteredCart);
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(cart));
    } catch {
      toast.error('Erro na remoção do produto');
    }
  };

  const updateProductAmount = async ({ productId, amount }: UpdateProductAmount) => {
    if(amount === 0)
      return;

    try {
      const response = await api.get(`/stock/${productId}`);
      const productInStock = response.data;
      const productInTheCart = cart.find(product => product.id === productId);

      if(productInTheCart) {
        if(productInTheCart.amount >= productInStock.amount) {
          toast.error('Quantidade solicitada fora de estoque');
          return;
        }

        const newCart = cart.map(product => {
          if(product.id === productInTheCart.id)
            product.amount = amount;
          
          return product;
        });

        setCart(newCart);
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(cart));
      }
    } catch {
      toast.error('Erro na alteração de quantidade do produto');
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
