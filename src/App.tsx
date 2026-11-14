import { Navigate, Route, Routes } from 'react-router-dom'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { DriveLayout } from '@/layouts/DriveLayout'
import { LandingPage } from '@/pages/LandingPage'
import { AllFilesPage } from '@/pages/AllFilesPage'
import { ArchivedPage } from '@/pages/ArchivedPage'
import { LoginPage } from '@/pages/LoginPage'
import { GoogleAuthPage } from '@/pages/GoogleAuthPage'
import { GoogleConnectedPage } from '@/pages/GoogleConnectedPage'
import { QuotaTrackerPage } from '@/pages/QuotaTrackerPage'
import { RecentPage } from '@/pages/RecentPage'
import { RegisterPage } from '@/pages/RegisterPage'
import { SettingsPage } from '@/pages/SettingsPage'
import { SharedPage } from '@/pages/SharedPage'
import { StarredPage } from '@/pages/StarredPage'
import { PublicFilePage } from '@/pages/PublicFilePage'
import { ApiManagementPage } from '@/pages/ApiManagementPage'
import { TrashPage } from '@/pages/TrashPage'
import { ActivityLogPage } from '@/pages/ActivityLogPage'
import { SetPasswordPage } from '@/pages/SetPasswordPage'
import { UploadProvider } from '@/context/UploadContext'


function App() {
  return (
    <UploadProvider>
      <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="landing" element={<LandingPage />} />
      <Route path="download" element={<LandingPage downloadFocus />} />
      <Route path="login" element={<LoginPage />} />
      <Route path="register" element={<RegisterPage />} />
      <Route path="set-password" element={<SetPasswordPage />} />
      <Route path="google-auth" element={<GoogleAuthPage />} />
      <Route path="google-connected" element={<GoogleConnectedPage />} />
      <Route path="public/files/:token" element={<PublicFilePage />} />
      <Route path="public/files/:token/embed" element={<PublicFilePage embed />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<DriveLayout />}>
          <Route path="all-files" element={<AllFilesPage />} />
          <Route path="quota" element={<QuotaTrackerPage />} />
          <Route path="shared" element={<SharedPage />} />
          <Route path="recent" element={<RecentPage />} />
          <Route path="starred" element={<StarredPage />} />
          <Route path="archived" element={<ArchivedPage />} />
          <Route path="trash" element={<TrashPage />} />
          <Route path="activity" element={<ActivityLogPage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="api" element={<ApiManagementPage />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </UploadProvider>
  )
}


export default App
