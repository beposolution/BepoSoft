import { createContext } from "react";
import {useState} from "react";



const Context = createContext();


const ContextProvider = ({ children }) => {

    const [products, setProducts] = useState([]);

    return (
        <Context.Provider value={[products, setProducts]}>
            {children}
        </Context.Provider>
    )
}


export default ContextProvider;