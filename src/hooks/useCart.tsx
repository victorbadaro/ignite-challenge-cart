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
      let newCart = [...cart];
      const productInTheCart = newCart.find(product => product.id === productId);
      let response = await api.get(`/stock/${productId}`);
      const productInTheStock: Stock = response.data;

      // caso o produto já exista no carrinho, somar uma quantidade à sua quantidade (amount) no carrinho
      if(productInTheCart) {
        if(productInTheStock.amount < productInTheCart.amount + 1) {
          toast.error('Quantidade solicitada fora de estoque');
          return;
        }

        productInTheCart.amount ++;
        setCart(newCart);
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart));
      } else {
        if(productInTheStock.amount < 1) {
          toast.error('Quantidade solicitada fora de estoque');
          return;
        }

        response = await api.get(`/products/${productId}`);
        const product = response.data;

        product.amount = 1;
        newCart = [ ...newCart, product ];

        setCart(newCart);
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart));
      }
    } catch {
      toast.error('Erro na adição do produto');
    }
  };

  const removeProduct = (productId: number) => {
    try {
      const product = cart.find(product => product.id === productId);

      if(!product) {
        toast.error('Erro na remoção do produto');
        return;
      }

      const filteredCart = cart.filter(product => product.id !== productId);

      setCart(filteredCart);
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(filteredCart));
    } catch {
      toast.error('Erro na remoção do produto');
    }
  };

  const updateProductAmount = async ({ productId, amount }: UpdateProductAmount) => {
    if(amount <= 0)
      return;

    try {
      let newCart = [...cart];
      const response = await api.get(`/stock/${productId}`);
      const productInStock = response.data;
      const productInTheCart = newCart.find(product => product.id === productId);

      if(productInTheCart) {
        if(productInStock.amount < amount) {
          toast.error('Quantidade solicitada fora de estoque');
          return;
        }

        productInTheCart.amount = amount;

        setCart(newCart);
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart));
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
