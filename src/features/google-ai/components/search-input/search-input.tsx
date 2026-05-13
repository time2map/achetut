import { useEffect, useRef, useState } from 'react';
import { View, TextInput, Pressable, Text, ActivityIndicator, TouchableOpacity, Keyboard } from 'react-native';
import { TCitySuggestion, useAutocompleteStore } from '@features/google-ai/store/autocomplete';
import { colors } from '@shared/styles';
import { useTopsStore } from '@features/google-ai/store/top';
import { searchInputStyles } from './search-input.styles';
import CrossIcon from '../icons/cross-icon';
import { EdgeInsets } from 'react-native-safe-area-context';
import Icon from '../icons/icon';
import BackIcon from '../icons/back-icon';

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
  const [isInputFocused, setIsInputFocused] = useState(false);
  const wasSearchOpenRef = useRef(false);
  const { autocomplete, isLoading, fetchAutocomplete, clear: clearAutocomplete } = useAutocompleteStore();

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

  const closeAll = () => {
    Keyboard.dismiss();
    setIsInputFocused(false);
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
        clearAutocomplete();
        onSearchPlace(fetchedFirstSuggestion);
        return;
      }
    }
  };

  useEffect(() => {
    const feature = currentUserPlace?.features?.[0];
    const props = feature?.properties ?? {};
    const city = props.city ?? props.town ?? props.village ?? '';
    const state = props.state ?? props.county ?? '';
    const country = props.country ?? '';
    const text = [city, state, country].filter(Boolean).join(', ');

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

  const shouldShowSuggestions = isInputFocused && (isLoading || (autocomplete && autocomplete.length > 0));

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
          style={searchInputStyles.dropdown}
          pointerEvents="auto">
          <View style={[searchInputStyles.header, isInputFocused ? null : searchInputStyles.headerCollapsed]}>
            {isInputFocused ? (
              <Pressable
                style={searchInputStyles.iconButton}
                onPress={closeAll}
                hitSlop={10}>
                <BackIcon size={16} />
              </Pressable>
            ) : null}

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

            {isInputFocused ? (
              <Pressable
                style={searchInputStyles.iconButton}
                onPress={close}
                hitSlop={10}>
                <CrossIcon
                  size={14}
                />
              </Pressable>
            ) : (
              <Pressable
                style={searchInputStyles.iconButton}
                onPress={() => inputRef.current?.focus()}
                hitSlop={10}>
                <Icon />
              </Pressable>
            )}
          </View>

          {shouldShowSuggestions ? <View style={searchInputStyles.divider} /> : null}

          {shouldShowSuggestions ? (
            <View style={searchInputStyles.suggestions}>
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
                      const nextText = `${item.name}, ${item.state}, ${item.country}`;
                      setQuery(nextText);
                      setSelectedPlace(item);
                      clearAutocomplete();
                    }}>
                    <Icon
                      width={16}
                      height={20}
                      color={colors.textPrimary}
                    />
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
          ) : null}
        </View>
      </View>
    </View>
  );
};

export default SearchInput;
