import { useMemo, useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { colors } from '@shared/styles';
import { promptInputStyles } from './prompt-input.styles';

interface PromptInputProps {
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
};

const PromptInput = ({
  value,
  onChangeText,
  placeholder = 'Tell us what you’re looking for today'
}: PromptInputProps) => {
  const [isFocused, setIsFocused] = useState(false);

  const shouldShowClear = useMemo(() => value.trim().length > 0, [value]);

  return (
    <View style={promptInputStyles.wrapper}>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textSecondary}
        multiline
        textAlignVertical="top"
        selectionColor={colors.primaryRed}
        style={[promptInputStyles.input, isFocused && promptInputStyles.inputFocused]}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
      />

      {shouldShowClear ? (
        <Pressable
          onPress={() => onChangeText('')}
          hitSlop={8}>
          <Text style={promptInputStyles.clearText}>Clear form</Text>
        </Pressable>
      ) : null}
    </View>
  );
};

export default PromptInput;
