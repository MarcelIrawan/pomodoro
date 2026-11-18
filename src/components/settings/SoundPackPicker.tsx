// Sound pack picker (F17) + per-pack preview.
import { preloadSoundPack, playCompletionSound } from '../../hooks/useAudio.ts';
import { SOUND_PACKS, type SoundPackName } from '../../types/index.ts';
import { IconVolume } from '../ui/Icons.tsx';
import { cn } from '../../utils/cn.ts';

export function SoundPackPicker({
  soundPack,
  onChange,
}: {
  soundPack: SoundPackName;
  onChange: (pack: SoundPackName) => void;
}) {
  return (
    <div class="sound-picker" role="radiogroup" aria-label="Sound pack">
      {SOUND_PACKS.map((pack) => (
        <button
          key={pack.id}
          role="radio"
          aria-checked={soundPack === pack.id}
          class={cn('sound-picker__option', soundPack === pack.id && 'sound-picker__option--active')}
          onClick={() => {
            onChange(pack.id);
            preloadSoundPack(pack.id);
          }}
        >
          <span class="sound-picker__label">{pack.label}</span>
          <span class="sound-picker__desc">{pack.description}</span>
          <span
            class="sound-picker__preview"
            role="button"
            tabIndex={0}
            aria-label={`Preview ${pack.label} sound pack`}
            onClick={(event) => {
              event.stopPropagation();
              playCompletionSound('work');
            }}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.stopPropagation();
                playCompletionSound('work');
              }
            }}
          >
            <IconVolume size={16} />
            Preview
          </span>
        </button>
      ))}
    </div>
  );
}
