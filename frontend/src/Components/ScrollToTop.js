import { useEffect } from "react";
import { useLocation } from "react-router-dom";

export default function ScrollToTop() {
    const location = useLocation();

    useEffect(() => {
        // If there is no hash, scroll to top immediately
        if (!location.hash) {
            window.scrollTo(0, 0);
        }
    }, [location]);

    return null;
}
