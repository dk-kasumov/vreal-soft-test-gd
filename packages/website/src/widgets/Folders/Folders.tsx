import {Typography} from '@mui/material';
import s from './Folders.module.scss';
import {useEffect, useState} from 'react';
import {useStore} from '@/store/store.ts';
import Folder from '@/widgets/Folders/Folder/Folder.tsx';
import {useSearchParams} from 'react-router-dom';
import AppButton from '@/shared/ui/AppButton/AppButton.tsx';
import CreateFolder from '@/widgets/Folders/CreateFolder/CreateFolder.tsx';
import {getAllFoldersApi, getFoldersApi} from '@/shared/api/folderAPI.ts';

function Folders() {
  const [isCreateFolderOpen, setIsCreateFolderOpen] = useState<boolean>(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const {folders, setFolders, setAllFolders} = useStore();

  const onFolderClick = (folderId: string) => {
    setSearchParams({folderId});
  };

  const getFolders = async () => {
    const [{data: allFolders}, {data: folders}] = await Promise.all([getAllFoldersApi(), getFoldersApi(searchParams.get('folderId'))]);

    setAllFolders(allFolders);
    setFolders(folders);
  };

  const onCreateFolder = (response: boolean) => {
    setIsCreateFolderOpen(false);

    if (response) {
      void getFolders();
    }
  };

  useEffect(() => {
    void getFolders();
  }, [searchParams]);

  return (
    <>
      <section className={s.section}>
        <header className={s.header}>
          <Typography variant={'h4'} gutterBottom>
            Folders
          </Typography>
          <AppButton text={'Create folder'} variant={'contained'} onClick={() => setIsCreateFolderOpen(true)} />
        </header>

        <div className={s.folders}>
          {folders &&
            folders.map(folder => (
              <Folder onClick={folderId => onFolderClick(folderId)} onFolderUpdated={() => getFolders()} key={folder.id} folder={folder} />
            ))}

          {!folders?.length && (
            <Typography variant={'subtitle1'} gutterBottom>
              No folders
            </Typography>
          )}
        </div>
      </section>

      <CreateFolder isOpen={isCreateFolderOpen} closeDialog={onCreateFolder} />
    </>
  );
}

export default Folders;
