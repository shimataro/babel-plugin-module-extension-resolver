#!/bin/bash
# update dependencies

set -e

DATE=$(date +"%Y%m%d")
BRANCH=feature/update-dependencies-${DATE}
COLOR_SUCCESS="\e[1;32m"
COLOR_RESET="\e[m"

cd $(dirname ${0})/..

# create branch
git checkout develop
git checkout -b ${BRANCH}

for WORK in . ./examples/*;
do
	pushd ${WORK}

	# check updates
	npm run check-updates -- -u

	# re-install packages
	rm -rf npm-shrinkwrap.json node_modules
	npm i

	# test
	npm run build
	npm run verify

	# add to git
	npm shrinkwrap
	git add package.json npm-shrinkwrap.json

	popd
done

# commit
git commit -m "update dependencies"

# finished!
echo -e "
${COLOR_SUCCESS}🎉All dependencies are updated successfully.🎉${COLOR_RESET}

Push changes and merge into 'develop' branch.

    git push --set-upstream origin ${BRANCH}
"
