import { Box, Button, DialogActions, DialogContent, Typography } from '@mui/material'
import { memo } from 'react'
import { MaskDialog, MaskTextField } from '@masknet/theme'
import { useDashboardI18N } from '../../../../locales/index.js'
import { useNavigate } from 'react-router-dom'
import { type PersonaIdentifier, DashboardRoutes } from '@masknet/shared-base'
import { useExportPrivateKey } from '../../hooks/useExportPrivateKey.js'
import { useCopyToClipboard } from 'react-use'

export interface ExportPrivateKeyDialogProps {
    open: boolean
    onClose: () => void
    identifier: PersonaIdentifier
}

export const ExportPrivateKeyDialog = memo<ExportPrivateKeyDialogProps>(({ open, onClose, identifier }) => {
    const t = useDashboardI18N()
    const navigate = useNavigate()
    const [state, copyToClipboard] = useCopyToClipboard()
    const { value: privateKey } = useExportPrivateKey(identifier)

    const getCopyButtonText = () => {
        if (state.value) {
            return t.personas_export_persona_copy_success()
        }
        if (state.error?.message) {
            return t.personas_export_persona_copy_failed()
        }
        return t.personas_export_persona_copy()
    }

    return (
        <MaskDialog open={open} title={t.personas_export_persona()} onClose={onClose}>
            <DialogContent>
                <MaskTextField value={privateKey} InputProps={{ disableUnderline: true }} fullWidth />
                <Box sx={{ mt: 3 }}>
                    <Typography variant="caption">
                        {t.personas_export_private_key_tip()}
                        <Button
                            variant="text"
                            sx={{ fontSize: 12, py: 0 }}
                            onClick={() => navigate(DashboardRoutes.Settings)}>
                            {t.settings_global_backup_title()}
                        </Button>
                    </Typography>
                </Box>
            </DialogContent>
            <DialogActions>
                <Button color="secondary" onClick={onClose}>
                    {t.personas_cancel()}
                </Button>
                <Button onClick={() => copyToClipboard(privateKey ?? '')}>{getCopyButtonText()}</Button>
            </DialogActions>
        </MaskDialog>
    )
})
