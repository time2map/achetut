import { useEffect, useRef, useState } from 'react';
import { View, TextInput, Pressable, Text, ActivityIndicator, TouchableOpacity, Keyboard } from 'react-native';
import { TCitySuggestion, useAutocompleteStore } from '@features/google-ai/store/autocomplete';
import { colors } from '@shared/styles';
import { useTopsStore } from '@features/google-ai/store/top';
import { searchInputStyles } from './search-input.styles';
import CrossIcon from '../icons/cross-icon';
import { EdgeInsets } from 'react-native-safe-area-context';

export type CurrentUserPlace = {
  features?: Array<{
    properties?: {
      name?: string;
      city?: string;
      town?: string;
      village?: string;
      state?: string;
      county?: string;
      country?: string;
      type?: string;
      osm_value?: string;
      countrycode?: string;
      osm_id?: number;
      extent?: number[];
    };
    geometry?: { coordinates?: [number, number] };
    bbox?: number[];
  }>;
} | null;

type SearchInputProps = {
  insets: EdgeInsets;
  isSearch: boolean;
  onSearchPlace: (selectedPlace: TCitySuggestion) => void;
  autoSubmitOnOpen?: boolean;
  onClose?: () => void;
  onRequestClose: () => void;
  currentUserPlace: CurrentUserPlace;
};

const SearchInput = ({
  insets,
  isSearch,
  onSearchPlace,
  autoSubmitOnOpen = true,
  onClose,
  onRequestClose,
  currentUserPlace
}: SearchInputProps) => {
  const [query, setQuery] = useState('');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<TextInput>(null);
  const lastAutoSubmitRef = useRef<string | null>(null);
  const [isInputFocused, setIsInputFocused] = useState(false);
  const wasSearchOpenRef = useRef(false);
  const { autocomplete, isLoading, fetchAutocomplete, clear: clearAutocomplete } = useAutocompleteStore();
  const [currentCity, setCurrentCity] = useState<string | null>(null);

  const { isLoading: isLoadingTopPlaces } = useTopsStore();

  const close = () => {
    if (query.length !== 0) {
      setQuery('');
      clearAutocomplete();
      return;
    }
    onRequestClose();
    clearAutocomplete();
    onClose?.();
  };

  const [selectedPlace, setSelectedPlace] = useState<TCitySuggestion | null>(null);
  const placeText = (place: TCitySuggestion) => `${place.name}, ${place.state}, ${place.country}`;
  const normalize = (value: string) => value.trim().toLowerCase();

  const submit = async (overrideQuery?: string) => {
    const q = (overrideQuery ?? query).trim();
    if (!q || isLoadingTopPlaces) return;
    Keyboard.dismiss();

    console.log('submit', q);

    const selectedText = selectedPlace ? placeText(selectedPlace) : null;
    const selectedMatches = selectedText && normalize(selectedText) === normalize(q);
    const matchedSuggestion =
      (selectedMatches ? selectedPlace : null) ??
      autocomplete.find((item) => normalize(placeText(item)) === normalize(q));

    // если совпадает с подсказкой — используем её
    if (matchedSuggestion) {
      const nextText = placeText(matchedSuggestion);
      setQuery(nextText);
      setCurrentCity(nextText);
      clearAutocomplete();
      onSearchPlace(matchedSuggestion);
      setSelectedPlace(null);

      return;
    }

    // иначе — fallback: берём первую подсказку, если она есть
    const firstSuggestion = autocomplete[0] as TCitySuggestion | undefined;
    if (firstSuggestion) {
      const nextText = placeText(firstSuggestion);
      setQuery(nextText);
      setCurrentCity(nextText);
      clearAutocomplete();

      onSearchPlace(firstSuggestion);
      return;
    }

    // если подсказок нет, но есть currentUserPlace — используем его
    const feature = currentUserPlace?.features?.[0];
    const props = feature?.properties ?? {};
    const city = props.city ?? props.town ?? props.village ?? '';
    const state = props.state ?? props.county ?? '';
    const country = props.country ?? '';
    const text = [city, state, country].filter(Boolean).join(', ');

    if (text && feature) {
      const fetchedAutocomplete = await fetchAutocomplete(text.trim());
      const fetchedFirstSuggestion = fetchedAutocomplete[0] as TCitySuggestion | undefined;
      if (fetchedFirstSuggestion) {
        setQuery(`${fetchedFirstSuggestion.name}, ${fetchedFirstSuggestion.state}, ${fetchedFirstSuggestion.country}`);
        setCurrentCity(
          `${fetchedFirstSuggestion.name}, ${fetchedFirstSuggestion.state}, ${fetchedFirstSuggestion.country}`
        );
        clearAutocomplete();
        onSearchPlace(fetchedFirstSuggestion);
        return;
      }

      return;
    }

    // если подсказок нет, оставляем введённый текст как текущий город
    setCurrentCity(q);
  };

  useEffect(() => {
    const feature = currentUserPlace?.features?.[0];
    const props = feature?.properties ?? {};
    const city = props.city ?? props.town ?? props.village ?? '';
    const state = props.state ?? props.county ?? '';
    const country = props.country ?? '';
    const text = [city, state, country].filter(Boolean).join(', ');

    setCurrentCity(text || null);
    setQuery(text || '');
  }, [currentUserPlace]);

  useEffect(() => {
    const wasOpen = wasSearchOpenRef.current;
    if (isSearch && !wasOpen && autoSubmitOnOpen) {
      const q = (query ?? '').trim();
      if (q) {
        submit(q);
      }
    }
    wasSearchOpenRef.current = isSearch;
  }, [isSearch, query]);

  if (!isSearch) return null;

  return (
    <View
      style={searchInputStyles.overlay}
      pointerEvents="box-none">
      <Pressable
        style={searchInputStyles.overlay}
        pointerEvents={isInputFocused ? 'auto' : 'none'}
        onPress={Keyboard.dismiss}
      />
      <View
        style={[searchInputStyles.container, { top: insets.top + 17 }]}
        pointerEvents="box-none">
        <View
          style={searchInputStyles.searchInput}
          pointerEvents="auto">
          <TextInput
            ref={inputRef}
            value={query}
            onFocus={() => setIsInputFocused(true)}
            onBlur={() => setIsInputFocused(false)}
            onChangeText={(text) => {
              setQuery(text);
              setSelectedPlace(null);
              if (debounceRef.current) {
                clearTimeout(debounceRef.current);
              }
              debounceRef.current = setTimeout(() => {
                fetchAutocomplete(text);
              }, 1000);
            }}
            placeholder="Search…"
            placeholderTextColor="rgba(0,0,0,0.45)"
            style={searchInputStyles.input}
            returnKeyType="search"
            onSubmitEditing={() => submit()}
            autoCorrect={false}
            autoCapitalize="none"
          />

          {/* маленькая кнопка справа */}
          {/* <Pressable
            style={[topButtonStyles.searchBtn, isLoadingTopPlaces ? { opacity: 0.3 } : null]}
            onPress={submit}
            disabled={isLoadingTopPlaces}
            hitSlop={10}>
            <SearchIcon
              size={15}
              color={colors.textPrimary}
            />
          </Pressable> */}

          {/* закрыть */}
          <Pressable
            style={searchInputStyles.button}
            onPress={close}
            hitSlop={10}>
            <CrossIcon
              size={24}
              color={'#49454F'}
            />
          </Pressable>
        </View>
        {(isLoading || (autocomplete && autocomplete.length > 0)) && (
          <View
            style={searchInputStyles.suggestions}
            pointerEvents="auto">
            {isLoading ? (
              <ActivityIndicator
                size="small"
                color={colors.textPrimary}
              />
            ) : (
              autocomplete.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={searchInputStyles.suggestionItem}
                  onPress={() => {
                    if (!item?.name) return;
                    const placeText = `${item.name}, ${item.state}, ${item.country}`;
                    setQuery(placeText);
                    setSelectedPlace(item);
                    clearAutocomplete();
                  }}>
                  <Text
                    style={searchInputStyles.suggestionText}
                    numberOfLines={2}
                    ellipsizeMode="tail">
                    {`${item.name}, ${item.state}, ${item.country}`}
                  </Text>
                </TouchableOpacity>
              ))
            )}
          </View>
        )}
      </View>
    </View>
  );
};

export default SearchInput;
