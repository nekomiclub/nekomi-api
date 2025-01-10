import DubberService from '~/core/services/DubberService';
import { DocumentDTO } from '~/core/services/DTO';
import { ERR_TYPE_INVALID } from '~/services/ErrorService';
import { IDubber } from '~/interfaces/Dubber';



//* ===================================== PATCH SETTINGS
export interface IDubberPatchSettingsProps {
  id: string
  nameUkr?: string
  nameEng?: string
  description?: string
  supportLinks?: Partial<IDubber['support']>
  socialLinks?: Partial<IDubber['socials']>
}

export async function PatchSettings({ id, description, nameEng, nameUkr, socialLinks, supportLinks }: IDubberPatchSettingsProps) {
  const dubberService = new DubberService();
  await dubberService.init(id);

  if (typeof nameUkr === 'string') await dubberService.changeName({ nameUkr });
  if (typeof nameEng === 'string') await dubberService.changeName({ nameEng });
  if (typeof description === 'string') await dubberService.changeDescription(description);

  if (typeof socialLinks === 'object') {
    for (const key in socialLinks) {
      if (typeof socialLinks[key] === 'string') await dubberService.changeSocials({ key: key as keyof IDubber['socials'], value: socialLinks[key] });
      else throw new ERR_TYPE_INVALID(`Social link for ${key} type is invalid`);
    }
  }

  if (typeof supportLinks === 'object') {
    for (const key in supportLinks) {
      if (typeof supportLinks[key] === 'string') await dubberService.changeSupport({ key: key as keyof IDubber['support'], value: supportLinks[key] });
      else throw new ERR_TYPE_INVALID(`Support link for ${key} type is invalid`);
    }
  }

  await dubberService.save();



  // TODO: Process dubber throught public DTO
  return {
    status: 200,
    message: 'Dubber settings changed',
    dubber: new DocumentDTO().dubber({ object: dubberService.dubber })
  };
}




export default class DubberController {
  static PatchSettings = PatchSettings;
}