import { createContext, useContext } from "react";
import { View, Text, TextProps, TouchableOpacity, TouchableOpacityProps, ActivityIndicator } from "react-native";
import clsx from "clsx";

type Variants = "primary" | "secondary";

type ButtonProps = TouchableOpacityProps & {
    variant?: Variants,
    isLoading?: boolean,
    className?: string
} 

const ThemeContext = createContext<{ variant?: Variants }>({})

function Button({ children, className, variant = "primary", isLoading = false, ...rest }: ButtonProps) {
    return (
        <TouchableOpacity 
            disabled={ isLoading }
            activeOpacity={0.7}
            { ...rest }
        >
            <View className={clsx(
                "w-full h-12 flex-row items-center justify-center rounded-lg gap-2",
                {
                    "bg-lime-300": variant === "primary",
                    "bg-zinc-800": variant === "secondary"
                },
                className
            )}>                
                <ThemeContext.Provider value={{ variant }}>
                    { isLoading ? <ActivityIndicator className={clsx({ "text-black": variant === "primary", "text-lime-300": variant === "secondary"})} />  : children }
                </ThemeContext.Provider>                 
            </View>
        </TouchableOpacity>
    )
}

function Title({ children }: TextProps){
    const { variant } = useContext(ThemeContext)
    return (
        <Text className={clsx(
            "text-base font-semibold",
            {
                "text-lime-950": variant === "primary",
                "text-zinc-200": variant === "secondary"
            }
        )}>
            { children }
        </Text>
    )
}

Button.Title = Title

export { Button };