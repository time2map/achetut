import { useEffect, useState } from 'react';
import { useStreetPlaceStore } from '../store/street-place';
import { useInfoPlaceStore } from '../store/info-place';
import { useWhatIsHereStore } from '../store/what-is-here';
import { useTopsStore } from '../store/top';

const useCatchErrors = () => {
  const { error: streetPlaceError } = useStreetPlaceStore();
  const { error: infoPlaceError } = useInfoPlaceStore();
  const { error: whatIsHereError } = useWhatIsHereStore();
  const { error: topPlacesError } = useTopsStore();
  const [errorPopup, setErrorPopup] = useState<{
    title: string;
    status?: number | string;
    message?: string;
  } | null>(null);

  const resetErrorPopup = () => {
    setErrorPopup(null);
  };

  useEffect(() => {
    if (infoPlaceError) {
      setErrorPopup({
        title: infoPlaceError.title,
        status: infoPlaceError.status,
        message: infoPlaceError.message
      });
    }
    if (streetPlaceError) {
      setErrorPopup({
        title: streetPlaceError.title,
        status: streetPlaceError.status,
        message: streetPlaceError.message
      });
    }
    if (whatIsHereError) {
      setErrorPopup({
        title: whatIsHereError.title,
        status: whatIsHereError.status,
        message: whatIsHereError.message
      });
    }
    if (topPlacesError) {
      setErrorPopup({
        title: topPlacesError.title,
        status: topPlacesError.status,
        message: topPlacesError.message
      });
    }
  }, [infoPlaceError, streetPlaceError, whatIsHereError, topPlacesError]);
  return { errorPopup, resetErrorPopup, setErrorPopup };
};

export default useCatchErrors;
