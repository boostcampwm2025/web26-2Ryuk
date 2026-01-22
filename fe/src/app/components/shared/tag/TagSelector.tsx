'use client';

import { useState, KeyboardEvent, CompositionEvent } from 'react';
import { DefaultTextfield } from '@/app/components/shared/textfield/Textfield';
import ToggleChip from '@/app/components/shared/chip/ToggleChip';
import { TagSelectorProps } from './type';
import styles from './tagSelector.module.css';

export default function TagSelector({
  defaultTags = [],
  selectedTags: initialSelectedTags = [],
  onChange,
  placeholder = '#대화방, #태그를, #입력하세요',
}: TagSelectorProps) {
  const [inputValue, setInputValue] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>(initialSelectedTags);
  const [isComposing, setIsComposing] = useState(false);

  const handleInputChange = (value: string) => {
    // 콤마는 입력 필드에 남기지 않음
    if (value.includes(',')) {
      const withoutComma = value.replace(/,/g, '');
      setInputValue(withoutComma);
      return;
    }

    // # 제거하고 실제 입력값 확인
    const actualValue = value.replace(/^#+/, '');

    // 태그 길이 제한: 10글자 (공백 제외)
    const tagLength = actualValue.replace(/\s/g, '').length;
    if (tagLength > 10) return; // 입력 자체를 막음

    // 한글 입력 중이면 # 자동 추가하지 않음
    if (isComposing) return setInputValue(value);

    // #으로 시작하지 않으면 자동으로 # 앞에 붙임
    if (value.length > 0 && !value.startsWith('#')) setInputValue('#' + value);
    else setInputValue(value);
  };

  const handleCompositionStart = () => {
    setIsComposing(true);
  };

  const handleCompositionEnd = (e: CompositionEvent<HTMLInputElement>) => {
    setIsComposing(false);
    // 조합 완료 후 # 자동 추가 체크
    const value = e.currentTarget.value;
    if (value.length > 0 && !value.startsWith('#')) setInputValue('#' + value);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    // 콤마는 항상 preventDefault (입력 필드에 남지 않도록)
    if (e.key === ',') {
      e.preventDefault();

      // 조합 중이 아니고 입력값이 있으면 태그 추가
      if (!isComposing && inputValue.trim() !== '') addTag(inputValue);
      return;
    }

    // Enter 키 처리
    if (e.key === 'Enter') {
      // 조합 중일 때는 태그 추가 불가
      if (isComposing) return e.preventDefault();

      e.preventDefault();
      if (inputValue.trim() !== '') addTag(inputValue);
    }
  };

  const handleBlur = () => {
    // 조합 중이 아니고 입력값이 있으면 태그 추가
    if (!isComposing && inputValue.trim() !== '') addTag(inputValue);
  };

  const addTag = (tagInput: string) => {
    // # 제거하고 태그 이름 추출
    let tagName = tagInput.replace(/^#+/, '').trim();

    // 공백이 있으면 _ 로 연결
    if (tagName.includes(' ')) tagName = tagName.replace(/\s+/g, '_');

    // 빈 태그 무시
    if (!tagName) return setInputValue('');

    // 중복 태그 무시
    if (selectedTags.includes(tagName)) return setInputValue('');

    // 새 태그 추가
    const newSelectedTags = [...selectedTags, tagName];
    setSelectedTags(newSelectedTags);
    onChange?.(newSelectedTags);
    setInputValue('');
  };

  const handleTagClick = (tagName: string) => {
    if (defaultTags.includes(tagName)) {
      // 기본값에 포함되어 있으면 토글
      if (selectedTags.includes(tagName)) {
        // 선택되어 있으면 해제
        const newSelectedTags = selectedTags.filter((tag) => tag !== tagName);
        setSelectedTags(newSelectedTags);
        onChange?.(newSelectedTags);
      } else {
        // 선택되어 있지 않으면 추가
        const newSelectedTags = [...selectedTags, tagName];
        setSelectedTags(newSelectedTags);
        onChange?.(newSelectedTags);
      }
    } else {
      // 기본값에 포함 안되어 있으면 삭제
      const newSelectedTags = selectedTags.filter((tag) => tag !== tagName);
      setSelectedTags(newSelectedTags);
      onChange?.(newSelectedTags);
    }
  };

  // 모든 태그
  const allTags = Array.from(new Set([...defaultTags, ...selectedTags]));

  return (
    <div className={styles.tagSelector}>
      <DefaultTextfield
        placeholder={placeholder}
        value={inputValue}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
        onCompositionStart={handleCompositionStart}
        onCompositionEnd={handleCompositionEnd}
      />
      {allTags.length > 0 && (
        <div className={styles.tagList}>
          {allTags.map((tag) => {
            const isSelected = selectedTags.includes(tag);
            return (
              <ToggleChip
                key={`tag-${tag}`}
                label={`#${tag}`}
                size="medium"
                checked={isSelected}
                onChange={() => handleTagClick(tag)}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
