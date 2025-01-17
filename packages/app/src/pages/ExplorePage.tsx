import { useMemo } from 'react'
import { PostInfoContext } from '@masknet/plugin-infra/content-script'
import { DashboardContainer } from '../components/DashboardContainer.js'
import { DashboardHeader } from '../components/DashboardHeader.js'
import { StickySearchHeader } from '../components/StickySearchBar.js'
import { createPostInfoContext } from '../helpers/createPostInfoContext.js'
import { DecryptMessage } from '../main/index.js'

export interface ExplorePageProps {}

export default function ExplorePage(props: ExplorePageProps) {
    const context = useMemo(() => createPostInfoContext(), [])

    return (
        <PostInfoContext.Provider value={context}>
            <DashboardContainer>
                <StickySearchHeader />

                <main id="explore">
                    <DashboardHeader title="Deployments" />

                    <div className="bg-white p-5">
                        <DecryptMessage />
                    </div>
                </main>
            </DashboardContainer>
        </PostInfoContext.Provider>
    )
}
